"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAddressCode,
  parseAddressCode,
} from "@/lib/ghana-post-gps";
import { ghanaLocations } from "@/lib/ghana-locations";
import { useToast } from "@/components/toast";
import EmptyState from "@/components/empty-state";
import UploadField from "@/components/upload-field";
import FilePreviewModal from "@/components/file-preview-modal";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { IMAGE_ACCEPT } from "@/lib/storage/accepts";
import { uploadFile } from "@/lib/storage/upload-client";

type Business = {
  id: string;
  businessName: string;
  city: string;
  status: string;
  createdAt: string;
};

const initialForm = {
  businessName: "",
  addressRegionCode: "",
  addressDistrictCode: "",
  addressCode: "",
  gpsLatitude: "",
  gpsLongitude: "",
  city: "",
  landmark: "",
  storeFrontUrl: "",
  storeInsideUrl: "",
};

export default function PartnerBusinessesPage() {
  const [form, setForm] = useState(initialForm);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [showForm, setShowForm] = useState(false);
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

  async function loadBusinesses() {
    const response = await fetch("/api/partner/businesses");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setBusinesses(data.businesses ?? []);
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(fieldKey: string, file: File) {
    setUploading((prev) => ({ ...prev, [fieldKey]: true }));
    setError(null);

    try {
      const pathname = `onboarding/business-${fieldKey}-${Date.now()}-${file.name}`;
      const result = await uploadFile({
        pathname,
        file,
        contentType: file.type,
        access: "public",
      });
      updateField(fieldKey, result.url);
    } catch {
      setError("Upload failed. Please try again.");
      notify({
        title: "Upload failed",
        message: "Please try again.",
        kind: "error",
      });
    } finally {
      setUploading((prev) => ({ ...prev, [fieldKey]: false }));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    const response = await fetch("/api/partner/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to submit business.");
      notify({
        title: "Submission failed",
        message: data.error ?? "Unable to submit business.",
        kind: "error",
      });
      setLoading(false);
      return;
    }

    setStatus("Business submitted for approval.");
    notify({
      title: "Business submitted",
      message: "Your submission is pending approval.",
      kind: "success",
    });
    setForm(initialForm);
    loadBusinesses();
    setShowForm(false);
    setLoading(false);
  }

  const businessesEmptyIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V7a2 2 0 0 1 2-2h4v15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20V9h8a2 2 0 0 1 2 2v9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h0.01M7 15h0.01M14 12h0.01M17 12h0.01M14 15h0.01M17 15h0.01" />
    </svg>
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Businesses</h1>
          <p className="text-sm text-gray-600">Add additional locations for approval.</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Submitted Businesses</h2>
            <button className="btn btn-primary" type="button" onClick={() => setShowForm(true)}>
              Add Business
            </button>
          </div>
          {businesses.length === 0 ? (
            <EmptyState
              icon={businessesEmptyIcon}
              title="No businesses submitted yet"
              description="Submit a business location to start the approval workflow."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 stagger">
              {businesses.map((business) => (
                <div key={business.id} className="card">
                  <span
                    className={`badge badge-${
                      business.status === "APPROVED"
                        ? "success"
                        : business.status === "DENIED"
                          ? "error"
                          : business.status === "EXPIRED"
                            ? "warning"
                            : "info"
                    }`}
                  >
                    {business.status}
                  </span>
                  <p className="text-sm font-medium">{business.businessName}</p>
                  <p className="text-xs text-gray-600">{business.city}</p>
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
              <h2 className="text-lg font-semibold">Add Business</h2>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="label">Business Name</label>
                <input
                  className="input"
                  value={form.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
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
              <div className="space-y-1">
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
              <div className="space-y-1">
                <label className="label">GPS Latitude</label>
                <input
                  className="input"
                  value={form.gpsLatitude}
                  onChange={(event) => updateField("gpsLatitude", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">GPS Longitude</label>
                <input
                  className="input"
                  value={form.gpsLongitude}
                  onChange={(event) => updateField("gpsLongitude", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Landmark</label>
                <input
                  className="input"
                  value={form.landmark}
                  onChange={(event) => updateField("landmark", event.target.value)}
                />
              </div>

              <UploadField
                label="Store Front Photo"
                value={form.storeFrontUrl}
                accept={IMAGE_ACCEPT}
                uploading={uploading.storeFrontUrl}
                onPreview={(url, anchorRect) =>
                  setPreview({
                    url,
                    label: "Store Front Photo",
                    kind: "image",
                    anchorRect: anchorRect ?? null,
                  })
                }
                onSelect={(file) => handleUpload("storeFrontUrl", file)}
              />
              <UploadField
                label="Store Inside Photo"
                value={form.storeInsideUrl}
                accept={IMAGE_ACCEPT}
                uploading={uploading.storeInsideUrl}
                onPreview={(url, anchorRect) =>
                  setPreview({
                    url,
                    label: "Store Inside Photo",
                    kind: "image",
                    anchorRect: anchorRect ?? null,
                  })
                }
                onSelect={(file) => handleUpload("storeInsideUrl", file)}
              />

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit business"}
                </button>
                {error ? <p className="form-message form-message-error">{error}</p> : null}
                {status ? <p className="form-message form-message-success">{status}</p> : null}
              </div>
            </form>
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
