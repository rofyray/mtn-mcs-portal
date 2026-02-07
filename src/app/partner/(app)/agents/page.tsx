"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import PostAuthToast from "@/components/post-auth-toast";
import { useToast } from "@/components/toast";
import EmptyState from "@/components/empty-state";
import UploadField from "@/components/upload-field";
import FilePreviewModal from "@/components/file-preview-modal";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { IMAGE_ACCEPT } from "@/lib/storage/accepts";
import { uploadFile } from "@/lib/storage/upload-client";

const AgentCredentialsModal = dynamic(
  () => import("@/components/agent-credentials-modal"),
  { ssr: false }
);

type Agent = {
  id: string;
  firstName: string;
  surname: string;
  phoneNumber: string;
  email: string;
  status: string;
  cpAppNumber?: string | null;
  agentUsername?: string | null;
  minervaReferralCode?: string | null;
  businessId: string;
  business?: Business;
  createdAt: string;
};

type Business = {
  id: string;
  businessName: string;
  city: string;
  addressCode: string;
  status: string;
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
  businessId: "",
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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [credentialsAgent, setCredentialsAgent] = useState<Agent | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [partnerBusinessName, setPartnerBusinessName] = useState("");
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

  async function loadAgents() {
    const response = await fetch("/api/partner/agents");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setAgents(data.agents ?? []);
    setBusinesses(data.businesses ?? []);
    setPartnerBusinessName(data.partnerBusinessName ?? "");
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

  function handleCredentialsSaved() {
    setCredentialsAgent(null);
    notify({
      title: "Credentials saved",
      message: "Agent details have been updated.",
      kind: "success",
    });
    loadAgents();
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Add agents for approval and track their status.</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Submitted Agents</h2>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setForm({ ...initialForm, businessName: partnerBusinessName });
                setShowForm(true);
              }}
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
                    <p className="text-xs text-gray-600 dark:text-gray-400">{agent.phoneNumber}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{agent.email}</p>
                    {agent.business ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Location: {agent.business.city} ({agent.business.addressCode})
                      </p>
                    ) : null}
                  </div>
                  {agent.cpAppNumber ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">CP App Number: {agent.cpAppNumber}</p>
                  ) : null}
                  {agent.agentUsername ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">Username: {agent.agentUsername}</p>
                  ) : null}
                  {agent.minervaReferralCode ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">Minerva Code: {agent.minervaReferralCode}</p>
                  ) : null}
                  {(!agent.cpAppNumber || !agent.agentUsername || !agent.minervaReferralCode) ? (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setCredentialsAgent(agent)}
                    >
                      {agent.cpAppNumber || agent.agentUsername || agent.minervaReferralCode
                        ? "Update Agent Info"
                        : "Add Agent Details"}
                    </button>
                  ) : null}
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
            {businesses.length === 0 ? (
              <EmptyState
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l4-6h10l4 6" />
                  </svg>
                }
                title="No locations available yet"
                description="Add at least one location before adding an agent."
              />
            ) : (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
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
                  className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  value={form.businessName}
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This is your registered business name from onboarding.
                </p>
              </div>
              <div className="space-y-1">
                <label className="label">Ghana Card Number</label>
                <input
                  className="input"
                  value={form.ghanaCardNumber}
                  onChange={(event) => updateField("ghanaCardNumber", event.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="label">Business Location</label>
                <select
                  className="input"
                  value={form.businessId}
                  onChange={(event) => updateField("businessId", event.target.value)}
                >
                  <option value="">Select a location</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.city} ({business.addressCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select the location where this agent will be assigned.
                </p>
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
            )}
          </div>
        </div>
      ) : null}
      <AgentCredentialsModal
        open={Boolean(credentialsAgent)}
        agentId={credentialsAgent?.id ?? ""}
        agentName={credentialsAgent ? `${credentialsAgent.firstName} ${credentialsAgent.surname}` : ""}
        existingCpAppNumber={credentialsAgent?.cpAppNumber}
        existingAgentUsername={credentialsAgent?.agentUsername}
        existingMinervaReferralCode={credentialsAgent?.minervaReferralCode}
        onClose={() => setCredentialsAgent(null)}
        onSaved={handleCredentialsSaved}
      />
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
