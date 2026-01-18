"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { buildAddressCode, parseAddressCode } from "@/lib/ghana-post-gps";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { useAdminActionsEnabled } from "@/hooks/use-admin-actions-enabled";
import { ghanaLocations } from "@/lib/ghana-locations";

const editableFields = [
  { key: "businessName", label: "Business Name" },
  { key: "partnerFirstName", label: "First Name" },
  { key: "partnerSurname", label: "Surname" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "paymentWallet", label: "Payment Wallet" },
  { key: "ghanaCardNumber", label: "Ghana Card Number" },
  { key: "taxIdentityNumber", label: "Tax Identity Number" },
  { key: "addressRegionCode", label: "Region" },
  { key: "addressDistrictCode", label: "District" },
  { key: "addressCode", label: "Digital Address Code" },
  { key: "gpsLatitude", label: "GPS Latitude" },
  { key: "gpsLongitude", label: "GPS Longitude" },
  { key: "city", label: "City/Town" },
  { key: "landmark", label: "Landmark" },
  { key: "apn", label: "APN" },
  { key: "mifiImei", label: "MiFi/Router IMEI" },
  { key: "ghanaCardFrontUrl", label: "Ghana Card Front URL" },
  { key: "ghanaCardBackUrl", label: "Ghana Card Back URL" },
  { key: "passportPhotoUrl", label: "Passport Photo URL" },
  { key: "businessCertificateUrl", label: "Business Certificate URL" },
  { key: "fireCertificateUrl", label: "Fire Certificate URL" },
  { key: "insuranceUrl", label: "Insurance URL" },
  { key: "storeFrontUrl", label: "Store Front URL" },
  { key: "storeInsideUrl", label: "Store Inside URL" },
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

export default function AdminPartnerDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
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
      const next: Record<string, string> = {};
      for (const field of editableFields) {
        next[field.key] = data.profile[field.key] ?? "";
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

    const response = await fetch(`/api/admin/partners/${id}`, {
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
    const reason = window.prompt("Reason for denial?");
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
            <p className="text-sm text-gray-600">Review and edit onboarding info.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => router.back()}
            >
              Go back
            </button>
            {canEdit ? (
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
            ) : null}
          </div>
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {status ? <p className="form-message form-message-success">{status}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {editableFields.map((field) => (
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
              ) : field.key === "apn" || field.key === "mifiImei" ? (
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="\\d*"
                  value={form[field.key] ?? ""}
                  onChange={(event) =>
                    updateField(field.key, event.target.value.replace(/\D/g, ""))
                  }
                  disabled={!canEdit}
                />
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
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : saveLabel}
          </button>
        ) : null}
      </div>
    </main>
  );
}
