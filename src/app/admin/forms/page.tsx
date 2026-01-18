"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminFormsEmptyIcon } from "@/components/admin-empty-icons";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { uploadFile } from "@/lib/storage/upload-client";

type Partner = {
  id: string;
  businessName: string | null;
  partnerFirstName: string | null;
  partnerSurname: string | null;
};

type FormRequest = {
  id: string;
  title: string;
  documentUrl: string;
  status: string;
  signedAt: string | null;
  partnerProfile: Partner;
};

export default function AdminFormsPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [forms, setForms] = useState<FormRequest[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

  useEffect(() => {
    async function loadData() {
      const partnerResponse = await fetch("/api/admin/partners?status=APPROVED");
      if (partnerResponse.ok) {
        const data = await partnerResponse.json();
        setPartners(data.partners ?? []);
      }

      const formResponse = await fetch("/api/admin/forms");
      if (formResponse.ok) {
        const data = await formResponse.json();
        setForms(data.forms ?? []);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!showFormModal) {
      return;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowFormModal(false);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showFormModal]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const pathname = `onboarding/forms/${Date.now()}-${file.name}`;
      const result = await uploadFile({
        pathname,
        file,
        contentType: file.type,
        access: "public",
      });
      setDocumentUrl(result.url);
    } catch {
      setError("Upload failed. Please try again.");
      notify({
        title: "Upload failed",
        message: "Please try again.",
        kind: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSend() {
    setError(null);
    setStatus(null);

    const response = await fetch("/api/admin/forms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, partnerIds: selectedPartners, documentUrl }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to send forms.");
      notify({
        title: "Send failed",
        message: data.error ?? "Unable to send forms.",
        kind: "error",
      });
      return;
    }

    setStatus("Forms sent to partners.");
    notify({
      title: "Forms sent",
      message: "Partners have been notified.",
      kind: "success",
    });
    setTitle("");
    setDocumentUrl("");
    setSelectedPartners([]);
    setShowFormModal(false);

    const formResponse = await fetch("/api/admin/forms");
    if (formResponse.ok) {
      const data = await formResponse.json();
      setForms(data.forms ?? []);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8 glass-panel p-6 page-animate">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Forms</h1>
            <p className="text-sm text-gray-600">Track and send onboarding documents.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => setShowFormModal(true)}>
            Send a form
          </button>
        </div>

        <section className="space-y-3 stagger">
          {forms.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<AdminFormsEmptyIcon />}
                title="No forms sent yet"
                description="Send a document to a partner to track signatures here."
                variant="inset"
              />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {forms.map((form) => (
                <div key={form.id} className="card">
                  <span className={`badge badge-${form.status === "SIGNED" ? "success" : "info"}`}>
                    {form.status}
                  </span>
                  <p className="text-sm font-semibold">{form.title}</p>
                  <p className="text-xs text-gray-600">
                    {form.partnerProfile.businessName ?? "Partner"}
                  </p>
                  <a className="text-xs link-accent" href={form.documentUrl} target="_blank" rel="noreferrer">
                    View document
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showFormModal ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="New form"
          onClick={() => setShowFormModal(false)}
        >
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-semibold">New form</h2>
                <p className="text-sm text-gray-600">Send documents to partners for signature.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowFormModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-2">
                <label className="label">Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="label">Upload Document (PDF/DOC)</label>
                <input
                  className="input"
                  type="file"
                  accept="application/pdf,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleUpload(file);
                    }
                  }}
                />
                {uploading ? <p className="text-xs text-gray-600">Uploading...</p> : null}
                {documentUrl ? <p className="text-xs text-gray-600">Uploaded</p> : null}
              </div>
              <div className="space-y-2">
                <label className="label">Select Partners</label>
                <div className="grid gap-2 md:grid-cols-2">
                  {partners.map((partner) => (
                    <label key={partner.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedPartners.includes(partner.id)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedPartners((prev) => [...prev, partner.id]);
                          } else {
                            setSelectedPartners((prev) => prev.filter((id) => id !== partner.id));
                          }
                        }}
                      />
                      {partner.businessName ?? "Partner"} ({partner.partnerFirstName} {partner.partnerSurname})
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="button" onClick={handleSend}>
                  Send form
                </button>
              </div>
              {error ? <p className="form-message form-message-error">{error}</p> : null}
              {status ? <p className="form-message form-message-success">{status}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
