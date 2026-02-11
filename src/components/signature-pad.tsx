"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadFile } from "@/lib/storage/upload-client";

type SignaturePadProps = {
  onSignatureReady: (url: string) => void;
  onClear?: () => void;
  onError?: (message: string) => void;
  uploading?: boolean;
  disabled?: boolean;
  existingSignatureUrl?: string;
};

export default function SignaturePad({
  onSignatureReady,
  onClear,
  onError,
  uploading: externalUploading = false,
  disabled = false,
  existingSignatureUrl,
}: SignaturePadProps) {
  const [tab, setTab] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const isDisabled = disabled || uploading || externalUploading;

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // White background so exported PNGs are readable in any theme
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111827";
  }, [tab]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isDisabled) return;
      const pos = getPos(e);
      if (!pos) return;
      isDrawingRef.current = true;
      hasDrawnRef.current = true;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    [isDisabled, getPos]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current || isDisabled) return;
      const pos = getPos(e);
      if (!pos) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDisabled, getPos]
  );

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111827";
    hasDrawnRef.current = false;
    onClear?.();
  }, [onClear]);

  async function uploadSignature(canvas: HTMLCanvasElement) {
    setUploading(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });
      const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
      const result = await uploadFile({
        file,
        pathname: `signatures/${file.name}`,
        contentType: "image/png",
      });
      onSignatureReady(result.url);
    } catch {
      onError?.("Signature upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleUseTyped() {
    if (!typedName.trim() || isDisabled) return;

    // Render typed text on a hidden canvas
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background so exported PNGs are readable in any theme
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'italic 48px "Brush Script MT", "Segoe Script", cursive';
    ctx.fillStyle = "#111827";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName.trim(), 20, 75);

    await uploadSignature(canvas);
  }

  async function handleUseDrawn() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current || isDisabled) return;
    await uploadSignature(canvas);
  }

  if (existingSignatureUrl) {
    return (
      <div className="sig-pad">
        <div className="sig-pad-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={existingSignatureUrl} alt="Signature" className="sig-pad-image" />
        </div>
        {!disabled && (
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => onClear?.()}
          >
            Change Signature
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="sig-pad">
      <div className="sig-pad-tabs">
        <button
          type="button"
          className={`sig-pad-tab ${tab === "type" ? "sig-pad-tab-active" : ""}`}
          onClick={() => setTab("type")}
          disabled={isDisabled}
        >
          Type
        </button>
        <button
          type="button"
          className={`sig-pad-tab ${tab === "draw" ? "sig-pad-tab-active" : ""}`}
          onClick={() => setTab("draw")}
          disabled={isDisabled}
        >
          Draw
        </button>
      </div>

      {tab === "type" ? (
        <div className="sig-pad-type">
          <input
            className="input"
            placeholder="Type your full name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            disabled={isDisabled}
          />
          {typedName.trim() && (
            <div className="sig-pad-typed-preview">{typedName}</div>
          )}
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={handleUseTyped}
            disabled={isDisabled || !typedName.trim()}
          >
            {uploading ? "Uploading..." : "Use Signature"}
          </button>
        </div>
      ) : (
        <div className="sig-pad-draw">
          <canvas
            ref={canvasRef}
            className="sig-pad-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          <div className="sig-pad-draw-actions">
            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={clearCanvas}
              disabled={isDisabled}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={handleUseDrawn}
              disabled={isDisabled}
            >
              {uploading ? "Uploading..." : "Use Signature"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
