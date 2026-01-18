"use client";

import { useEffect, useRef, useState } from "react";

import EmptyState from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { uploadFile } from "@/lib/storage/upload-client";

type FormRequest = {
  id: string;
  title: string;
  documentUrl: string;
  status: string;
  signature: { id: string; signatureUrl: string } | null;
};

export default function PartnerFormsPage() {
  const [forms, setForms] = useState<FormRequest[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormRequest | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    async function loadForms() {
      const response = await fetch("/api/partner/forms");
      if (!response.ok) {
        setError("Unable to load forms.");
        notify({ title: "Forms unavailable", message: "Unable to load forms.", kind: "error" });
        return;
      }
      const data = await response.json();
      setForms(data.forms ?? []);
    }

    loadForms();
  }, [notify]);

  function startDrawing(event: React.MouseEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    ctx.stroke();
  }

  function stopDrawing() {
    drawing.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function submitSignature() {
    if (!selectedForm) {
      setError("Select a form to sign.");
      notify({ title: "Missing form", message: "Select a form to sign.", kind: "warning" });
      return;
    }
    if (!signerName.trim()) {
      setError("Enter signer name.");
      notify({ title: "Missing signer name", message: "Enter signer name.", kind: "warning" });
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Signature canvas unavailable.");
      notify({ title: "Signature unavailable", message: "Signature canvas unavailable.", kind: "error" });
      return;
    }

    setSigning(true);
    setError(null);

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/png")
      );

      if (!blob) {
        setError("Unable to capture signature.");
        notify({ title: "Signature failed", message: "Unable to capture signature.", kind: "error" });
        setSigning(false);
        return;
      }

      const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
      const uploadResult = await uploadFile({
        pathname: `onboarding/signatures/${file.name}`,
        file,
        contentType: file.type,
        access: "public",
      });

      const response = await fetch(`/api/partner/forms/${selectedForm.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, signatureUrl: uploadResult.url }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Unable to submit signature.");
        notify({
          title: "Submission failed",
          message: data.error ?? "Unable to submit signature.",
          kind: "error",
        });
        setSigning(false);
        return;
      }

      setSignerName("");
      clearSignature();
      notify({
        title: "Form submitted",
        message: "Your signature has been submitted.",
        kind: "success",
      });

      const formsResponse = await fetch("/api/partner/forms");
      if (formsResponse.ok) {
        const data = await formsResponse.json();
        setForms(data.forms ?? []);
      }
    } catch {
      setError("Unable to submit signature.");
      notify({ title: "Submission failed", message: "Unable to submit signature.", kind: "error" });
    } finally {
      setSigning(false);
    }
  }

  const formsEmptyIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
    </svg>
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Forms</h1>
          <p className="text-sm text-gray-600">Sign and submit forms from admins.</p>
        </div>

        {forms.length === 0 ? (
          <EmptyState
            icon={formsEmptyIcon}
            title="No forms assigned yet"
            description="New forms will appear here when they are assigned by an admin."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger">
            {forms.map((form) => (
              <button
                key={form.id}
                className={`rounded border p-3 text-left ${selectedForm?.id === form.id ? "border-black" : "border-gray-200"}`}
                type="button"
                onClick={() => setSelectedForm(form)}
              >
                <span className={`badge badge-${form.status === "SIGNED" ? "success" : "info"}`}>
                  {form.status}
                </span>
                <p className="text-sm font-semibold">{form.title}</p>
                <a className="text-xs link-accent" href={form.documentUrl} target="_blank" rel="noreferrer">
                  View document
                </a>
              </button>
            ))}
          </div>
        )}

        {forms.length > 0 ? (
          <section className="space-y-4 rounded border p-4">
            <h2 className="text-lg font-semibold">Sign Selected Form</h2>
            <div className="space-y-2">
              <label className="label">Signer Name</label>
              <input
                className="input"
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Draw Your Signature</label>
              <div className="rounded border bg-white p-2">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <button className="btn btn-secondary" type="button" onClick={clearSignature}>
                Clear signature
              </button>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={submitSignature}
              disabled={signing}
            >
              {signing ? "Submitting..." : "Submit signed form"}
            </button>
            {error ? <p className="form-message form-message-error">{error}</p> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
