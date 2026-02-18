"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import EmptyState from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { IMAGE_ACCEPT } from "@/lib/storage/accepts";
import { uploadFile } from "@/lib/storage/upload-client";

const FilePreviewModal = dynamic(() => import("@/components/file-preview-modal"));

type PaySlip = {
  id: string;
  imageUrl: string;
  originalFilename: string;
  displayFilename: string;
  createdAt: string;
};

export default function PartnerPaySlipsPage() {
  const [paySlips, setPaySlips] = useState<PaySlip[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null);
  const { notify } = useToast();
  useAutoDismiss(error, setError);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadPaySlips = useCallback(async () => {
    const response = await fetch("/api/partner/payslips");
    if (response.ok) {
      const data = await response.json();
      setPaySlips(data.paySlips ?? []);
    }
  }, []);

  useEffect(() => {
    loadPaySlips();
  }, [loadPaySlips]);

  async function handleFileSelected(file: File) {
    setUploading(true);
    setError(null);
    try {
      const uploadResult = await uploadFile({
        file,
        pathname: `onboarding/payslips/${Date.now()}-${file.name}`,
        contentType: file.type,
        access: "public",
      });

      const response = await fetch("/api/partner/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadResult.url,
          originalFilename: file.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Upload failed.");
        notify({ title: "Upload failed", message: data.error ?? "Upload failed.", kind: "error" });
        return;
      }

      notify({ title: "Pay slip uploaded", message: "Your payment slip has been uploaded.", kind: "success" });
      await loadPaySlips();
    } catch {
      setError("Upload failed.");
      notify({ title: "Upload failed", message: "Unable to upload pay slip.", kind: "error" });
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleFileSelected(file);
  }

  const emptyIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 3 3 5-5 4 4" />
      <circle cx="9" cy="9" r="1.5" />
    </svg>
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Pay Slips</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload photos of your bank payment slips.
          </p>
        </div>

        {/* Upload section */}
        <section className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              className="btn btn-primary"
              type="button"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Take Photo"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image
            </button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={handleInputChange}
          />
          {error ? <p className="form-message form-message-error">{error}</p> : null}
        </section>

        {/* History */}
        {paySlips.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title="No pay slips uploaded yet"
            description="Upload a photo of your bank payment slip using the buttons above."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 stagger">
            {paySlips.map((slip) => (
              <button
                key={slip.id}
                type="button"
                className="card-flat p-3 text-left space-y-2 cursor-pointer hover:ring-2 hover:ring-black/10 transition-shadow"
                onClick={() => setPreview({ url: slip.imageUrl, label: slip.displayFilename })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slip.imageUrl}
                  alt={slip.displayFilename}
                  className="w-full h-32 object-cover rounded"
                />
                <p className="text-xs font-medium truncate">{slip.displayFilename}</p>
                <p className="text-xs text-gray-500">
                  {new Date(slip.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {preview ? (
        <FilePreviewModal
          open
          url={preview.url}
          label={preview.label}
          kind="image"
          onClose={() => setPreview(null)}
        />
      ) : null}
    </main>
  );
}
