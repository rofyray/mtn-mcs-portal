"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAddressCode,
  parseAddressCode,
} from "@/lib/ghana-post-gps";
import { ghanaLocations } from "@/lib/ghana-locations";
import PostAuthToast from "@/components/post-auth-toast";
import { useToast } from "@/components/toast";
import EmptyState from "@/components/empty-state";
import UploadField from "@/components/upload-field";
import FilePreviewModal from "@/components/file-preview-modal";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { IMAGE_ACCEPT } from "@/lib/storage/accepts";
import { uploadFile } from "@/lib/storage/upload-client";

type Agent = {
  id: string;
  firstName: string;
  surname: string;
  phoneNumber: string;
  email: string;
  status: string;
  cpAppNumber?: string | null;
  createdAt: string;
};

const initialForm = {
  firstName: "",
  surname: "",
  phoneNumber: "",
  email: "",
  ghanaCardNumber: "",
  ghanaCardFrontUrl: "",
  ghanaCardBackUrl: "",
  passportPhotoUrl: "",
  addressRegionCode: "",
  addressDistrictCode: "",
  addressCode: "",
  city: "",
  businessName: "",
};

const phonePrefix = "+233";

function formatPhoneForStorage(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  return digits ? `${phonePrefix}${digits}` : "";
}

function formatPhoneForDisplay(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  const withoutPrefix = digits.startsWith("233") ? digits.slice(3) : digits;
  return withoutPrefix.length > 9 ? withoutPrefix.slice(-9) : withoutPrefix;
}

export default function PartnerAgentsPage() {
  const [form, setForm] = useState(initialForm);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cpAppAgentId, setCpAppAgentId] = useState<string | null>(null);
  const [cpAppNumber, setCpAppNumber] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<{
    url: string;
    label: string;
    kind: "image" | "pdf";
    anchorRect?: DOMRect | null;
  } | null>(null);
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

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

  async function loadAgents() {
    const response = await fetch("/api/partner/agents");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setAgents(data.agents ?? []);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(fieldKey: string, file: File) {
    setUploading((prev) => ({ ...prev, [fieldKey]: true }));
    setError(null);

    try {
      const pathname = `onboarding/agent-${fieldKey}-${Date.now()}-${file.name}`;
      const result = await uploadFile({
        pathname,
        file,
        contentType: file.type,
        access: "public",
      });
      updateField(fieldKey, result.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading((prev) => ({ ...prev, [fieldKey]: false }));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    const response = await fetch("/api/partner/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to submit agent.");
      notify({
        title: "Submission failed",
        message: data.error ?? "Unable to submit agent.",
        kind: "error",
      });
      setLoading(false);
      return;
    }

    setStatus("Agent submitted for approval.");
    notify({
      title: "Agent submitted",
      message: "Your agent is now pending approval.",
      kind: "success",
    });
    setForm(initialForm);
    loadAgents();
    setShowForm(false);
    setLoading(false);
  }

  async function saveCpAppNumber() {
    if (!cpAppAgentId || !cpAppNumber.trim()) {
      setError("Enter a CP app number to continue.");
      return;
    }
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/partner/agents/${cpAppAgentId}/cp-app`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpAppNumber }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to save CP app number.");
      notify({
        title: "Save failed",
        message: data.error ?? "Unable to save CP app number.",
        kind: "error",
      });
    } else {
      notify({
        title: "CP app number saved",
        message: "Agent verification can now continue.",
        kind: "success",
      });
      setCpAppAgentId(null);
      setCpAppNumber("");
      loadAgents();
    }

    setLoading(false);
  }

  const agentsEmptyIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 18a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2H7v-2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8a3 3 0 1 0 6 0a3 3 0 0 0-6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20v-2a5 5 0 0 1 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 20v-2a5 5 0 0 0-5-5" />
    </svg>
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <PostAuthToast />
      <div className="mx-auto w-full max-w-5xl space-y-8 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm text-gray-600">Add agents for approval and track their status.</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Submitted Agents</h2>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setShowForm(true)}
            >
              Add Agent
            </button>
          </div>
          {agents.length === 0 ? (
            <EmptyState
              icon={agentsEmptyIcon}
              title="No agents submitted yet"
              description="Add your first agent to start the approval process."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 stagger">
              {agents.map((agent) => (
                <div key={agent.id} className="card space-y-2">
                  <span
                    className={`badge badge-${
                      agent.status === "APPROVED"
                        ? "success"
                        : agent.status === "DENIED"
                          ? "error"
                          : agent.status === "EXPIRED"
                            ? "warning"
                            : "info"
                    }`}
                  >
                    {agent.status}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {agent.firstName} {agent.surname}
                    </p>
                    <p className="text-xs text-gray-600">{agent.phoneNumber}</p>
                    <p className="text-xs text-gray-600">{agent.email}</p>
                  </div>
                  {agent.cpAppNumber ? (
                    <p className="text-xs text-gray-600">CP App Number: {agent.cpAppNumber}</p>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setCpAppAgentId(agent.id)}
                    >
                      Add CP App Number
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showForm ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Add Agent</h2>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="label">First Name</label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Surname</label>
                <input
                  className="input"
                  value={form.surname}
                  onChange={(event) => updateField("surname", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Phone Number</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">{phonePrefix}</span>
                  <input
                    className="input input-prefix-field"
                    inputMode="numeric"
                    pattern="\\d{9}"
                    maxLength={9}
                    placeholder="24xxxxxxx"
                    value={formatPhoneForDisplay(form.phoneNumber)}
                    onChange={(event) => updateField("phoneNumber", formatPhoneForStorage(event.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label">Email</label>
                <input
                  className="input"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Business Name</label>
                <input
                  className="input"
                  value={form.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Ghana Card Number</label>
                <input
                  className="input"
                  value={form.ghanaCardNumber}
                  onChange={(event) => updateField("ghanaCardNumber", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">City/Town</label>
                <input
                  className="input"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Region</label>
                <select
                  className="input"
                  value={form.addressRegionCode}
                  onChange={(event) => {
                    updateField("addressRegionCode", event.target.value);
                    updateField("addressDistrictCode", "");
                    updateField("addressCode", "");
                  }}
                >
                  <option value="">Select</option>
                  {regionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label">District</label>
                <select
                  className="input"
                  value={form.addressDistrictCode}
                  onChange={(event) => {
                    updateField("addressDistrictCode", event.target.value);
                    updateField("addressCode", "");
                  }}
                  disabled={!form.addressRegionCode}
                >
                  <option value="">Select</option>
                  {districtOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="label">Digital Address Code</label>
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
                    value={parseAddressCode(form.addressCode).area}
                    onChange={(event) => {
                      const parts = parseAddressCode(form.addressCode);
                      updateField(
                        "addressCode",
                        buildAddressCode(
                          (form.addressDistrictCode ?? "").toUpperCase(),
                          event.target.value,
                          parts.unique
                        )
                      );
                    }}
                    disabled={!form.addressDistrictCode}
                  />
                  <span className="address-code-divider">-</span>
                  <input
                    className="input address-code-segment"
                    inputMode="numeric"
                    pattern="\\d{3,4}"
                    maxLength={4}
                    placeholder="4567"
                    value={parseAddressCode(form.addressCode).unique}
                    onChange={(event) => {
                      const parts = parseAddressCode(form.addressCode);
                      updateField(
                        "addressCode",
                        buildAddressCode(
                          (form.addressDistrictCode ?? "").toUpperCase(),
                          parts.area,
                          event.target.value
                        )
                      );
                    }}
                    disabled={!form.addressDistrictCode}
                  />
                </div>
              </div>

              <UploadField
                label="Ghana Card Front"
                value={form.ghanaCardFrontUrl}
                accept={IMAGE_ACCEPT}
                uploading={uploading.ghanaCardFrontUrl}
                onPreview={(url, anchorRect) =>
                  setPreview({
                    url,
                    label: "Ghana Card Front",
                    kind: "image",
                    anchorRect: anchorRect ?? null,
                  })
                }
                onSelect={(file) => handleUpload("ghanaCardFrontUrl", file)}
              />
              <UploadField
                label="Ghana Card Back"
                value={form.ghanaCardBackUrl}
                accept={IMAGE_ACCEPT}
                uploading={uploading.ghanaCardBackUrl}
                onPreview={(url, anchorRect) =>
                  setPreview({
                    url,
                    label: "Ghana Card Back",
                    kind: "image",
                    anchorRect: anchorRect ?? null,
                  })
                }
                onSelect={(file) => handleUpload("ghanaCardBackUrl", file)}
              />
              <UploadField
                label="Passport Photo"
                value={form.passportPhotoUrl}
                accept={IMAGE_ACCEPT}
                uploading={uploading.passportPhotoUrl}
                onPreview={(url, anchorRect) =>
                  setPreview({
                    url,
                    label: "Passport Photo",
                    kind: "image",
                    anchorRect: anchorRect ?? null,
                  })
                }
                onSelect={(file) => handleUpload("passportPhotoUrl", file)}
              />

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit agent"}
                </button>
                {error ? <p className="form-message form-message-error">{error}</p> : null}
                {status ? <p className="form-message form-message-success">{status}</p> : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {cpAppAgentId ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Add CP App Number</h2>
              <button className="btn btn-ghost" type="button" onClick={() => setCpAppAgentId(null)}>
                Close
              </button>
            </div>
            <div className="space-y-3">
              <label className="label">CP App Number</label>
              <input
                className="input"
                value={cpAppNumber}
                onChange={(event) => setCpAppNumber(event.target.value)}
              />
              <button className="btn btn-primary" type="button" onClick={saveCpAppNumber} disabled={loading}>
                {loading ? "Saving..." : "Save CP App Number"}
              </button>
              {error ? <p className="form-message form-message-error">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      <FilePreviewModal
        open={Boolean(preview)}
        url={preview?.url ?? ""}
        label={preview?.label ?? "Preview"}
        kind={preview?.kind ?? "image"}
        anchorRect={preview?.anchorRect ?? null}
        onClose={() => setPreview(null)}
      />
    </main>
  );
}
