"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { buildAddressCode, parseAddressCode } from "@/lib/ghana-post-gps";
import { ghanaLocations } from "@/lib/ghana-locations";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { useAdminActionsEnabled } from "@/hooks/use-admin-actions-enabled";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import UploadField from "@/components/upload-field";
import FilePreviewModal from "@/components/file-preview-modal";
import { IMAGE_ACCEPT } from "@/lib/storage/accepts";
import { deleteUploadedFile, uploadFile } from "@/lib/storage/upload-client";

const editableFields = [
  { key: "firstName", label: "First Name" },
  { key: "surname", label: "Surname" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "email", label: "Email" },
  { key: "cpAppNumber", label: "CP App Number" },
  { key: "ghanaCardNumber", label: "Ghana Card Number" },
  { key: "addressRegionCode", label: "Region" },
  { key: "addressDistrictCode", label: "District" },
  { key: "addressCode", label: "Digital Address Code" },
  { key: "city", label: "City/Town" },
  { key: "businessName", label: "Business Name" },
];

const fileFields = [
  { key: "ghanaCardFrontUrl", label: "Ghana Card Front", kind: "image" as const, accept: IMAGE_ACCEPT },
  { key: "ghanaCardBackUrl", label: "Ghana Card Back", kind: "image" as const, accept: IMAGE_ACCEPT },
  { key: "passportPhotoUrl", label: "Passport Photo", kind: "image" as const, accept: IMAGE_ACCEPT },
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

export default function AdminAgentDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string | null>>({});
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"details" | "location" | "photos">("details");
  const [preview, setPreview] = useState<{
    url: string;
    label: string;
    kind: "image" | "pdf";
    anchorRect?: DOMRect | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const { confirm, confirmDialog, getInputValue } = useConfirmDialog();
  const actionsEnabled = useAdminActionsEnabled();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

  useEffect(() => {
    if (!id) {
      return;
    }
    async function loadAgent() {
      const response = await fetch(`/api/admin/agents/${id}`);
      if (!response.ok) {
        setError("Unable to load agent.");
        return;
      }
      const data = await response.json();
      const next: Record<string, string | null> = {};
      for (const field of editableFields) {
        next[field.key] = data.agent[field.key] ?? "";
      }
      for (const field of fileFields) {
        next[field.key] = data.agent[field.key] ?? null;
      }
      setForm(next);
      setAdminRole(data.adminRole ?? null);
      setAgentStatus(data.agent.status ?? null);
    }

    loadAgent();
  }, [id]);

  const canEdit = adminRole === "FULL" ? actionsEnabled : Boolean(adminRole);
  const saveLabel = agentStatus === "DENIED" ? "Update details" : "Save changes";
  const detailsFields = editableFields.filter((field) =>
    ["firstName", "surname", "phoneNumber", "email", "businessName", "cpAppNumber", "ghanaCardNumber"].includes(
      field.key
    )
  );
  const locationFields = editableFields.filter((field) =>
    ["addressRegionCode", "addressDistrictCode", "addressCode", "city"].includes(field.key)
  );
  const photoFields = fileFields.filter((field) => field.kind === "image");

  const regionOptions = useMemo(() => {
    return Object.values(ghanaLocations).map((region) => ({
      value: region.code,
      label: region.name,
    }));
  }, []);

  const districtOptions = useMemo(() => {
    const regionCode = form.addressRegionCode;
    if (!regionCode || !ghanaLocations[regionCode]) {
      return [];
    }
    return ghanaLocations[regionCode].districts.map((district) => ({
      value: district.code,
      label: district.name,
    }));
  }, [form.addressRegionCode]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function renderEditableField(field: (typeof editableFields)[number]) {
    return (
      <div key={field.key} className="space-y-1">
        <label className="label">{field.label}</label>
        {field.key === "phoneNumber" ? (
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
        ) : field.key === "addressRegionCode" ? (
          <div className="space-y-1">
            <select
              className="input"
              value={form[field.key] ?? ""}
              onChange={(event) => {
                updateField(field.key, event.target.value);
                updateField("addressDistrictCode", "");
                updateField("addressCode", "");
              }}
              disabled={!canEdit}
            >
              <option value="">Select region</option>
              {regionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.addressRegionCode ? (
              <p className="text-xs text-gray-500">Code: {form.addressRegionCode}</p>
            ) : null}
          </div>
        ) : field.key === "addressDistrictCode" ? (
          <div className="space-y-1">
            <select
              className="input"
              value={form[field.key] ?? ""}
              onChange={(event) => {
                updateField(field.key, event.target.value);
                updateField("addressCode", "");
              }}
              disabled={!canEdit || !form.addressRegionCode}
            >
              <option value="">Select district</option>
              {districtOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.addressDistrictCode ? (
              <p className="text-xs text-gray-500">Code: {form.addressDistrictCode}</p>
            ) : null}
          </div>
        ) : field.key === "addressCode" ? (
          <div className="address-code-grid">
            <input
              className="input address-code-segment address-code-prefix"
              value={(form.addressDistrictCode ?? "").toUpperCase()}
              disabled
            />
            <span className="address-code-divider">-</span>
            <input
              className="input address-code-segment"
              inputMode="numeric"
              pattern="\\d{3,4}"
              maxLength={4}
              placeholder="123"
              value={parseAddressCode(form.addressCode ?? "").area}
              onChange={(event) => {
                const parts = parseAddressCode(form.addressCode ?? "");
                updateField(
                  "addressCode",
                  buildAddressCode(
                    (form.addressDistrictCode ?? "").toUpperCase(),
                    event.target.value,
                    parts.unique
                  )
                );
              }}
              disabled={!canEdit || !form.addressDistrictCode}
            />
            <span className="address-code-divider">-</span>
            <input
              className="input address-code-segment"
              inputMode="numeric"
              pattern="\\d{3,4}"
              maxLength={4}
              placeholder="4567"
              value={parseAddressCode(form.addressCode ?? "").unique}
              onChange={(event) => {
                const parts = parseAddressCode(form.addressCode ?? "");
                updateField(
                  "addressCode",
                  buildAddressCode(
                    (form.addressDistrictCode ?? "").toUpperCase(),
                    parts.area,
                    event.target.value
                  )
                );
              }}
              disabled={!canEdit || !form.addressDistrictCode}
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
    const response = await fetch(`/api/admin/agents/${id}`, {
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
      const pathname = `onboarding/admin-agent-${id}-${key}-${Date.now()}-${file.name}`;
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

    const response = await fetch(`/api/admin/agents/${id}`, {
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
        message: "Agent details updated.",
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
      description: "This will mark the agent as approved.",
      confirmLabel: "Approve",
      confirmVariant: "primary",
    });
    if (!confirmed) {
      return;
    }
    const response = await fetch(`/api/admin/agents/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      setError("Unable to approve submission.");
      notify({ title: "Approval failed", message: "Unable to approve submission.", kind: "error" });
      return;
    }
    setStatus("Submission approved.");
    notify({ title: "Submission approved", message: "Agent is now approved.", kind: "success" });
    setAgentStatus("APPROVED");
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
    const response = await fetch(`/api/admin/agents/${id}/deny`, {
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
    notify({ title: "Submission denied", message: "Agent submission denied.", kind: "warning" });
    setAgentStatus("DENIED");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agent Details</h1>
            <p className="text-sm text-gray-600">Review and edit agent info.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" type="button" onClick={() => router.back()}>
              Go back
            </button>
            {canEdit ? (
              <>
                <button className="btn btn-danger-light" type="button" onClick={handleDeny}>
                  Deny
                </button>
                <button className="btn btn-primary" type="button" onClick={handleApprove}>
                  Approve
                </button>
              </>
            ) : null}
          </div>
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {status ? <p className="form-message form-message-success">{status}</p> : null}

        <div className="tab-group" role="tablist" aria-label="Agent detail sections">
          <button
            className="tab-button"
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            aria-controls="agent-details-tab"
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className="tab-button"
            type="button"
            role="tab"
            aria-selected={activeTab === "location"}
            aria-controls="agent-location-tab"
            onClick={() => setActiveTab("location")}
          >
            Location
          </button>
          {photoFields.length > 0 ? (
            <button
              className="tab-button"
              type="button"
              role="tab"
              aria-selected={activeTab === "photos"}
              aria-controls="agent-photos-tab"
              onClick={() => setActiveTab("photos")}
            >
              Photos
            </button>
          ) : null}
        </div>
        {activeTab === "details" ? (
          <div id="agent-details-tab" role="tabpanel" className="grid gap-4 md:grid-cols-2">
            {detailsFields.map((field) => renderEditableField(field))}
          </div>
        ) : null}
        {activeTab === "location" ? (
          <div id="agent-location-tab" role="tabpanel" className="grid gap-4 md:grid-cols-2">
            {locationFields.map((field) => renderEditableField(field))}
          </div>
        ) : null}
        {activeTab === "photos" ? (
          <div id="agent-photos-tab" role="tabpanel" className="grid gap-4 md:grid-cols-2">
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

        {canEdit ? (
          <button className="btn btn-primary" type="button" onClick={handleSave} disabled={loading}>
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
