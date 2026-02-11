"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { useAdminActionsEnabled } from "@/hooks/use-admin-actions-enabled";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import UploadField from "@/components/upload-field";
import FilePreviewModal from "@/components/file-preview-modal";
import { DOCUMENT_ACCEPT, IMAGE_ACCEPT } from "@/lib/storage/accepts";
import { deleteUploadedFile, uploadFile } from "@/lib/storage/upload-client";
import { ghanaLocations, GREATER_ACCRA_REGION_CODE, GREATER_ACCRA_SBUS } from "@/lib/ghana-locations";

const editableFields = [
  { key: "businessName", label: "Business Name" },
  { key: "partnerFirstName", label: "First Name" },
  { key: "partnerSurname", label: "Surname" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "paymentWallet", label: "Payment Wallet" },
  { key: "ghanaCardNumber", label: "Ghana Card Number" },
  { key: "taxIdentityNumber", label: "Tax Identity Number" },
  { key: "regionCode", label: "Region" },
  { key: "sbuCode", label: "SBU" },
];

const fileFields = [
  { key: "passportPhotoUrl", label: "Passport Photo", kind: "image" as const, accept: IMAGE_ACCEPT },
  { key: "businessCertificateUrl", label: "Business Certificate", kind: "pdf" as const, accept: DOCUMENT_ACCEPT },
  { key: "fireCertificateUrl", label: "Fire Certificate", kind: "pdf" as const, accept: DOCUMENT_ACCEPT },
  { key: "insuranceUrl", label: "Insurance Document", kind: "pdf" as const, accept: DOCUMENT_ACCEPT },
];

const phonePrefix = "+233";

function formatPhoneForStorage(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  return digits ? `${phonePrefix}${digits}` : "";
}

function formatPhoneForDisplay(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  const withoutPrefix = digits.startsWith("233") ? digits.slice(3) : digits;
  return withoutPrefix.length > 9 ? withoutPrefix.slice(-9) : withoutPrefix;
}

function parseGhanaCard(value?: string | null) {
  const raw = value ?? "";
  const match = raw.match(/^([A-Za-z]{0,3})-?(\d{0,9})-?(\d?)$/);
  if (!match) {
    const letters = raw.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    return { prefix: letters, main: digits.slice(0, 9), check: digits.slice(9, 10) };
  }
  return {
    prefix: (match[1] ?? "").toUpperCase(),
    main: match[2] ?? "",
    check: match[3] ?? "",
  };
}

function buildGhanaCardValue(prefix: string, main: string, check: string) {
  if (!prefix && !main && !check) return "";
  const p = prefix.toUpperCase();
  return `${p}-${main}${check ? `-${check}` : ""}`;
}

const regionOptions = Object.values(ghanaLocations)
  .map((region) => ({
    value: region.code,
    label: region.name,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export default function AdminPartnerDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string | null>>({});
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"details" | "photos" | "documents">("details");
  const [preview, setPreview] = useState<{
    url: string;
    label: string;
    kind: "image" | "pdf";
    anchorRect?: DOMRect | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const { confirm, confirmDialog, getInputValue } = useConfirmDialog();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

  useEffect(() => {
    if (!id) {
      return;
    }
    async function loadProfile() {
      const response = await fetch(`/api/admin/partners/${id}`);
      if (!response.ok) {
        setError("Unable to load profile.");
        return;
      }
      const data = await response.json();
      const next: Record<string, string | null> = {};
      for (const field of editableFields) {
        next[field.key] = data.profile[field.key] ?? "";
      }
      for (const field of fileFields) {
        next[field.key] = data.profile[field.key] ?? null;
      }
      setForm(next);
      setAdminRole(data.adminRole ?? null);
      setShowAdminActions(data.adminRole !== "FULL");
      setProfileStatus(data.profile.status ?? null);
    }

    loadProfile();
  }, [id]);

  const actionsEnabled = useAdminActionsEnabled();
  const canEdit = adminRole === "FULL" ? actionsEnabled : showAdminActions;
  const saveLabel = profileStatus === "DENIED" ? "Update details" : "Save changes";
  const photoFields = fileFields.filter((field) => field.kind === "image");
  const documentFields = fileFields.filter((field) => field.kind === "pdf");

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function renderEditableField(field: (typeof editableFields)[number]) {
    if (field.key === "regionCode") {
      return (
        <div key={field.key} className="space-y-1">
          <label className="label">{field.label}</label>
          <select
            className="input"
            value={form[field.key] ?? ""}
            onChange={(event) => {
              updateField("regionCode", event.target.value);
              updateField("sbuCode", "");
            }}
            disabled={!canEdit}
          >
            <option value="">Select</option>
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.key === "sbuCode") {
      if (form.regionCode !== GREATER_ACCRA_REGION_CODE) return null;
      return (
        <div key={field.key} className="space-y-1">
          <label className="label">{field.label}</label>
          <select
            className="input"
            value={form[field.key] ?? ""}
            onChange={(e) => updateField("sbuCode", e.target.value)}
            disabled={!canEdit}
          >
            <option value="">Select SBU</option>
            {GREATER_ACCRA_SBUS.map((sbu) => (
              <option key={sbu.code} value={sbu.code}>
                {sbu.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.key === "ghanaCardNumber") {
      const gc = parseGhanaCard(form[field.key]);
      return (
        <div key={field.key} className="space-y-1">
          <label className="label">{field.label}</label>
          <div className="ghana-card-grid">
            <input
              className="input ghana-card-prefix"
              placeholder="GHA"
              maxLength={3}
              value={gc.prefix}
              onChange={(e) => {
                const letters = e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 3);
                updateField("ghanaCardNumber", buildGhanaCardValue(letters, gc.main, gc.check));
              }}
              disabled={!canEdit}
            />
            <span className="ghana-card-divider">-</span>
            <input
              className="input ghana-card-main"
              inputMode="numeric"
              placeholder="000000000"
              maxLength={9}
              value={gc.main}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                updateField("ghanaCardNumber", buildGhanaCardValue(gc.prefix, digits, gc.check));
              }}
              disabled={!canEdit}
            />
            <span className="ghana-card-divider">-</span>
            <input
              className="input ghana-card-check"
              inputMode="numeric"
              placeholder="0"
              maxLength={1}
              value={gc.check}
              onChange={(e) => {
                const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
                updateField("ghanaCardNumber", buildGhanaCardValue(gc.prefix, gc.main, digit));
              }}
              disabled={!canEdit}
            />
          </div>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1">
        <label className="label">{field.label}</label>
        {field.key === "phoneNumber" || field.key === "paymentWallet" ? (
          <div className="input-prefix-wrap">
            <span className="input-prefix">{phonePrefix}</span>
            <input
              className="input input-prefix-field"
              inputMode="numeric"
              pattern="\\d{9}"
              maxLength={9}
              placeholder="24xxxxxxx"
              value={formatPhoneForDisplay(form[field.key])}
              onChange={(event) => updateField(field.key, formatPhoneForStorage(event.target.value))}
              disabled={!canEdit}
            />
          </div>
        ) : (
          <input
            className="input"
            value={form[field.key] ?? ""}
            onChange={(event) => updateField(field.key, event.target.value)}
            disabled={!canEdit}
          />
        )}
      </div>
    );
  }

  async function updateFileField(key: string, value: string | null) {
    if (!id) {
      return false;
    }
    const response = await fetch(`/api/admin/partners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to update file.");
      notify({
        title: "Update failed",
        message: data.error ?? "Unable to update file.",
        kind: "error",
      });
      return false;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
    return true;
  }

  async function handleFileUpload(key: string, file: File) {
    if (!id) {
      return;
    }
    setUploading((prev) => ({ ...prev, [key]: true }));
    setError(null);

    const previousUrl = form[key];

    try {
      const pathname = `onboarding/admin-partner-${id}-${key}-${Date.now()}-${file.name}`;
      const result = await uploadFile({
        pathname,
        file,
        contentType: file.type,
        access: "public",
      });

      const updated = await updateFileField(key, result.url);
      if (updated && previousUrl) {
        try {
          await deleteUploadedFile(previousUrl);
        } catch (deleteError) {
          const message = deleteError instanceof Error ? deleteError.message : "Unable to delete old file.";
          notify({
            title: "Old file not removed",
            message,
            kind: "warning",
          });
        }
      }
    } catch {
      setError("Upload failed. Please try again.");
      notify({ title: "Upload failed", message: "Please try again.", kind: "error" });
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleFileDelete(key: string, label: string) {
    const currentUrl = form[key];
    if (!currentUrl) {
      return;
    }
    const confirmed = await confirm({
      title: `Delete ${label}?`,
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      confirmVariant: "danger",
    });
    if (!confirmed) {
      return;
    }
    setDeleting((prev) => ({ ...prev, [key]: true }));
    setError(null);

    try {
      const updated = await updateFileField(key, null);
      if (updated) {
        await deleteUploadedFile(currentUrl);
      }
    } catch {
      setError("Unable to delete file.");
      notify({ title: "Delete failed", message: "Unable to delete file.", kind: "error" });
    } finally {
      setDeleting((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleSave() {
    if (!id) {
      return;
    }
    setLoading(true);
    setStatus(null);
    setError(null);

    const payload: Record<string, string | null> = { ...form };
    for (const field of fileFields) {
      payload[field.key] = form[field.key] ? form[field.key] : null;
    }

    const response = await fetch(`/api/admin/partners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to save changes.");
      notify({
        title: "Save failed",
        message: data.error ?? "Unable to save changes.",
        kind: "error",
      });
    } else {
      setStatus("Changes saved.");
      notify({
        title: "Changes saved",
        message: "Partner details updated.",
        kind: "success",
      });
    }

    setLoading(false);
  }

  async function handleApprove() {
    if (!id) {
      return;
    }
    const confirmed = await confirm({
      title: "Approve submission?",
      description: "This will mark the partner as approved.",
      confirmLabel: "Approve",
      confirmVariant: "primary",
    });
    if (!confirmed) {
      return;
    }
    const response = await fetch(`/api/admin/partners/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      setError("Unable to approve submission.");
      notify({ title: "Approval failed", message: "Unable to approve submission.", kind: "error" });
      return;
    }
    setStatus("Submission approved.");
    notify({ title: "Submission approved", message: "Partner is now approved.", kind: "success" });
    setProfileStatus("APPROVED");
  }

  async function handleDeny() {
    const confirmed = await confirm({
      title: "Deny submission?",
      description: "Provide a reason for denying this submission.",
      confirmLabel: "Deny",
      confirmVariant: "danger",
      inputLabel: "Reason for denial",
      inputPlaceholder: "Add a brief reason",
      inputRequired: true,
    });
    if (!confirmed) {
      return;
    }
    const reason = getInputValue().trim();
    if (!reason) {
      return;
    }
    if (!id) {
      return;
    }
    const response = await fetch(`/api/admin/partners/${id}/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      setError("Unable to deny submission.");
      notify({ title: "Denial failed", message: "Unable to deny submission.", kind: "error" });
      return;
    }
    setStatus("Submission denied.");
    notify({ title: "Submission denied", message: "Partner submission denied.", kind: "warning" });
    setProfileStatus("DENIED");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Partner Details</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review and edit onboarding info.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => router.back()}
            >
              Go back
            </button>
            {(profileStatus === "APPROVED" || profileStatus === "DENIED") && (
              <span className={`badge badge-${profileStatus === "APPROVED" ? "success" : "error"}`}>
                {profileStatus}
              </span>
            )}
            {profileStatus !== "APPROVED" && canEdit && (
              <>
                <button
                  className="btn btn-danger-light"
                  type="button"
                  onClick={handleDeny}
                >
                  Deny
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleApprove}
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {status ? <p className="form-message form-message-success">{status}</p> : null}

        <div className="tab-group" role="tablist" aria-label="Partner detail sections">
          <button
            className="tab-button"
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            aria-controls="partner-details-tab"
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className="tab-button"
            type="button"
            role="tab"
            aria-selected={activeTab === "photos"}
            aria-controls="partner-photos-tab"
            onClick={() => setActiveTab("photos")}
          >
            Photos
          </button>
          <button
            className="tab-button"
            type="button"
            role="tab"
            aria-selected={activeTab === "documents"}
            aria-controls="partner-documents-tab"
            onClick={() => setActiveTab("documents")}
          >
            Documents
          </button>
        </div>
        {activeTab === "details" ? (
          <div id="partner-details-tab" role="tabpanel" className="grid gap-4 md:grid-cols-2">
            {editableFields.map((field) => renderEditableField(field))}
          </div>
        ) : null}
        {activeTab === "photos" ? (
          <div id="partner-photos-tab" role="tabpanel" className="grid gap-4 md:grid-cols-2">
            {photoFields.map((field) => {
              const lockReplace = canEdit && Boolean(form[field.key]);
              return (
                <UploadField
                  key={field.key}
                  className="md:col-span-2"
                  label={field.label}
                  value={form[field.key]}
                  accept={field.accept}
                  uploading={uploading[field.key]}
                  deleting={deleting[field.key]}
                  disabled={!canEdit}
                  uploadDisabled={lockReplace}
                  helperNote={lockReplace ? "Delete first to upload a new file." : undefined}
                  buttonLabel={form[field.key] ? "Replace file" : "Upload file"}
                  onSelect={(file) => handleFileUpload(field.key, file)}
                  onRemove={() => handleFileDelete(field.key, field.label)}
                  onPreview={(url, anchorRect) =>
                    setPreview({ url, label: field.label, kind: field.kind, anchorRect: anchorRect ?? null })
                  }
                />
              );
            })}
          </div>
        ) : null}
        {activeTab === "documents" ? (
          <div id="partner-documents-tab" role="tabpanel" className="grid gap-4 md:grid-cols-2">
            {documentFields.map((field) => {
              const lockReplace = canEdit && Boolean(form[field.key]);
              return (
                <UploadField
                  key={field.key}
                  className="md:col-span-2"
                  label={field.label}
                  value={form[field.key]}
                  accept={field.accept}
                  uploading={uploading[field.key]}
                  deleting={deleting[field.key]}
                  disabled={!canEdit}
                  uploadDisabled={lockReplace}
                  helperNote={lockReplace ? "Delete first to upload a new file." : undefined}
                  buttonLabel={form[field.key] ? "Replace file" : "Upload file"}
                  onSelect={(file) => handleFileUpload(field.key, file)}
                  onRemove={() => handleFileDelete(field.key, field.label)}
                  onPreview={(url, anchorRect) =>
                    setPreview({ url, label: field.label, kind: field.kind, anchorRect: anchorRect ?? null })
                  }
                />
              );
            })}
          </div>
        ) : null}

        {canEdit ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : saveLabel}
          </button>
        ) : null}
        <FilePreviewModal
          open={Boolean(preview)}
          url={preview?.url ?? ""}
          label={preview?.label ?? "Preview"}
          kind={preview?.kind ?? "image"}
          anchorRect={preview?.anchorRect ?? null}
          onClose={() => setPreview(null)}
        />
        {confirmDialog}
      </div>
    </main>
  );
}
