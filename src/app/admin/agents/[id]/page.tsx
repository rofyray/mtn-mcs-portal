"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { buildAddressCode, parseAddressCode } from "@/lib/ghana-post-gps";
import { ghanaLocations } from "@/lib/ghana-locations";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { useAdminActionsEnabled } from "@/hooks/use-admin-actions-enabled";

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
  { key: "ghanaCardFrontUrl", label: "Ghana Card Front URL" },
  { key: "ghanaCardBackUrl", label: "Ghana Card Back URL" },
  { key: "passportPhotoUrl", label: "Passport Photo URL" },
];

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

export default function AdminAgentDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
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
      const next: Record<string, string> = {};
      for (const field of editableFields) {
        next[field.key] = data.agent[field.key] ?? "";
      }
      setForm(next);
      setAdminRole(data.adminRole ?? null);
      setAgentStatus(data.agent.status ?? null);
    }

    loadAgent();
  }, [id]);

  const canEdit = adminRole === "FULL" ? actionsEnabled : Boolean(adminRole);
  const saveLabel = agentStatus === "DENIED" ? "Update details" : "Save changes";

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

  async function handleSave() {
    if (!id) {
      return;
    }
    setLoading(true);
    setStatus(null);
    setError(null);

    const response = await fetch(`/api/admin/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    const reason = window.prompt("Reason for denial?");
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

        <div className="grid gap-4 md:grid-cols-2">
          {editableFields.map((field) => (
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
          ))}
        </div>

        {canEdit ? (
          <button className="btn btn-primary" type="button" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : saveLabel}
          </button>
        ) : null}
      </div>
    </main>
  );
}
