"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { useAdmin } from "@/contexts/admin-context";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { ghanaLocations } from "@/lib/ghana-locations";
import { uploadFile } from "@/lib/storage/upload-client";
import UploadField from "@/components/upload-field";
import { IMAGE_ACCEPT } from "@/lib/storage/accepts";
import {
  type OnboardRequestFormData,
  INITIAL_FORM,
  BUSINESS_TYPES,
  REGISTERED_NATURES,
} from "@/lib/onboard-request-constants";

const SignaturePad = dynamic(() => import("@/components/signature-pad"));

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

const STEPS = [
  { label: "Company Details", icon: "building" },
  { label: "Signatory & Contact", icon: "person" },
  { label: "PEP Declaration", icon: "shield" },
  { label: "Photos", icon: "camera" },
  { label: "Review & Sign", icon: "clipboard" },
] as const;

function StepIcon({ type }: { type: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "building":
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
        </svg>
      );
    case "person":
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "camera":
      return (
        <svg {...props}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...props}>
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M9 15l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

function SectionIcon({ type }: { type: string }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "building":
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
        </svg>
      );
    case "person":
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "camera":
      return (
        <svg {...props}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...props}>
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M9 15l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function NewOnboardRequestPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-10">
          <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate panel-loading">
            <span className="panel-spinner" aria-label="Loading" />
          </div>
        </main>
      }
    >
      <NewOnboardRequestPage />
    </Suspense>
  );
}

function NewOnboardRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { admin } = useAdmin();

  // Redirect if accessed without an edit ID (coordinators no longer create forms from scratch)
  useEffect(() => {
    if (!editId) {
      router.replace("/admin/onboard-requests");
    }
  }, [editId, router]);
  const { notify } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardRequestFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  useAutoDismiss(error, setError);

  const regionOptions = useMemo(() => {
    if (!admin) return [];
    return Object.entries(ghanaLocations)
      .map(([code, region]) => ({
        value: code,
        label: region.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [admin]);

  // Load existing draft if editing
  useEffect(() => {
    if (!editId) return;
    async function loadForm() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/onboard-requests/${editId}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        const f = data.form;
        setForm({
          businessName: f.businessName ?? "",
          dateOfIncorporation: f.dateOfIncorporation
            ? new Date(f.dateOfIncorporation).toISOString().split("T")[0]
            : "",
          businessType: f.businessType ?? "",
          businessTypeOther: f.businessTypeOther ?? "",
          registeredNature: f.registeredNature ?? "",
          registrationCertNo: f.registrationCertNo ?? "",
          mainOfficeLocation: f.mainOfficeLocation ?? "",
          regionCode: f.regionCode ?? "",
          tinNumber: f.tinNumber ?? "",
          postalAddress: f.postalAddress ?? "",
          physicalAddress: f.physicalAddress ?? "",
          companyPhone: f.companyPhone ?? "",
          digitalPostAddress: f.digitalPostAddress ?? "",
          authorizedSignatory: f.authorizedSignatory ?? INITIAL_FORM.authorizedSignatory,
          contactPerson: f.contactPerson ?? INITIAL_FORM.contactPerson,
          pepDeclaration: f.pepDeclaration ?? INITIAL_FORM.pepDeclaration,
          imageUrls: f.imageUrls ?? [],
          completionDate: f.completionDate
            ? new Date(f.completionDate).toISOString().split("T")[0]
            : "",
          comments: "",
          signatureUrl: "",
        });
      } catch {
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [editId]);

  const updateField = useCallback((key: keyof OnboardRequestFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSignatory = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({
        ...prev,
        authorizedSignatory: { ...prev.authorizedSignatory, [field]: value },
      }));
    },
    []
  );

  const updateContact = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({
        ...prev,
        contactPerson: { ...prev.contactPerson, [field]: value },
      }));
    },
    []
  );

  const updatePep = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({
        ...prev,
        pepDeclaration: { ...prev.pepDeclaration, [field]: value },
      }));
    },
    []
  );

  async function handleImageUpload(file: File) {
    if (form.imageUrls.length >= 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setUploading((prev) => ({ ...prev, photos: true }));
    try {
      const pathname = `onboard-requests/photos/${Date.now()}-${file.name}`;
      const result = await uploadFile({ file, pathname, contentType: file.type });
      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, result.url] }));
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, photos: false }));
    }
  }

  function removeImage(index: number) {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  }

  async function handleSaveDraft() {
    if (!form.businessName.trim() || !form.regionCode) {
      setError("Business name and region are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        dateOfIncorporation: form.dateOfIncorporation || undefined,
        completionDate: form.completionDate || undefined,
      };
      const method = editId ? "PUT" : "POST";
      const url = editId
        ? `/api/admin/onboard-requests/${editId}`
        : "/api/admin/onboard-requests";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      const data = await response.json();
      notify({ title: "Draft saved", message: "Form saved as draft.", kind: "success" });
      if (!editId) {
        router.replace(`/admin/onboard-requests/new?id=${data.form.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!form.businessName.trim() || !form.regionCode) {
      setError("Business name and region are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Save first
      const payload = {
        ...form,
        dateOfIncorporation: form.dateOfIncorporation || undefined,
        completionDate: form.completionDate || undefined,
      };
      const method = editId ? "PUT" : "POST";
      const saveUrl = editId
        ? `/api/admin/onboard-requests/${editId}`
        : "/api/admin/onboard-requests";
      const saveResponse = await fetch(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!saveResponse.ok) {
        const data = await saveResponse.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      const saveData = await saveResponse.json();
      const formId = editId ?? saveData.form.id;

      // Then submit
      const submitResponse = await fetch(
        `/api/admin/onboard-requests/${formId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: form.comments || undefined,
            signatureUrl: form.signatureUrl || undefined,
            signatureDate: form.completionDate || new Date().toISOString(),
          }),
        }
      );
      if (!submitResponse.ok) {
        const data = await submitResponse.json().catch(() => ({}));
        throw new Error(data.error ?? "Submit failed");
      }

      notify({
        title: "Submitted",
        message: "Onboard request submitted to manager for review.",
        kind: "success",
      });
      router.push("/admin/onboard-requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading && editId) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate panel-loading">
          <span className="panel-spinner" aria-label="Loading" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">
            {editId ? "Edit Onboard Request" : "New Onboard Request"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            MCS Partner Onboard Request Form
          </p>
        </div>

        {/* Step indicator — onboarding-step cards */}
        <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`onboarding-step ${i === step ? "onboarding-step-active" : ""}`}
              onClick={() => setStep(i)}
            >
              <span className="onboarding-step-icon">
                <StepIcon type={s.icon} />
              </span>
              <span className="text-xs font-medium leading-tight">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Section title with icon */}
        <div className="space-y-1">
          <div className="onboarding-title">
            <span className="onboarding-title-icon">
              <SectionIcon type={STEPS[step].icon} />
            </span>
            <h2 className="text-lg font-semibold">{STEPS[step].label}</h2>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 ml-12">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {error && <p className="form-message form-message-error">{error}</p>}

        {/* Step 1: Company Details */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="label">Business Name</label>
              <input
                className="input"
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="Enter business name"
              />
            </div>

            <div className="space-y-1">
              <label className="label">Date of Incorporation</label>
              <input
                className="input"
                type="date"
                value={form.dateOfIncorporation}
                onChange={(e) => updateField("dateOfIncorporation", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="label">Type of Business</label>
              <div className="space-y-2">
                {BUSINESS_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="businessType"
                      value={type}
                      checked={form.businessType === type}
                      onChange={(e) => updateField("businessType", e.target.value)}
                    />
                    {type}
                  </label>
                ))}
              </div>
              {form.businessType === "Other" && (
                <input
                  className="input mt-2"
                  placeholder="Specify other type"
                  value={form.businessTypeOther}
                  onChange={(e) => updateField("businessTypeOther", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="label">Registered Nature of Entity</label>
              <select
                className="input"
                value={form.registeredNature}
                onChange={(e) => updateField("registeredNature", e.target.value)}
              >
                <option value="">Select nature</option>
                {REGISTERED_NATURES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="label">Certificate of Registration No.</label>
              <input
                className="input"
                value={form.registrationCertNo}
                onChange={(e) => updateField("registrationCertNo", e.target.value)}
                placeholder="Registration certificate number"
              />
            </div>

            <div className="space-y-1">
              <label className="label">Main Office Location</label>
              <input
                className="input"
                value={form.mainOfficeLocation}
                onChange={(e) => updateField("mainOfficeLocation", e.target.value)}
                placeholder="Main office location"
              />
            </div>

            <div className="space-y-1">
              <label className="label">Region</label>
              <select
                className="input"
                value={form.regionCode}
                onChange={(e) => updateField("regionCode", e.target.value)}
              >
                <option value="">Select region</option>
                {regionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="label">TIN Number</label>
              <input
                className="input"
                value={form.tinNumber}
                onChange={(e) => updateField("tinNumber", e.target.value)}
                placeholder="Tax Identification Number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label">Postal Address</label>
                <input
                  className="input"
                  value={form.postalAddress}
                  onChange={(e) => updateField("postalAddress", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Physical Address</label>
                <input
                  className="input"
                  value={form.physicalAddress}
                  onChange={(e) => updateField("physicalAddress", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label">Company Phone</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">{phonePrefix}</span>
                  <input
                    className="input input-prefix-field"
                    inputMode="numeric"
                    pattern="\d{9}"
                    maxLength={9}
                    value={formatPhoneForDisplay(form.companyPhone)}
                    onChange={(e) => updateField("companyPhone", formatPhoneForStorage(e.target.value))}
                    placeholder="24xxxxxxx"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label">Digital Post Address</label>
                <input
                  className="input"
                  value={form.digitalPostAddress}
                  onChange={(e) => updateField("digitalPostAddress", e.target.value)}
                  placeholder="e.g. GA-123-4567"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Signatory & Contact */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                Authorized Signatory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={form.authorizedSignatory.name}
                    onChange={(e) => updateSignatory("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Designation</label>
                  <input
                    className="input"
                    value={form.authorizedSignatory.designation}
                    onChange={(e) => updateSignatory("designation", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Phone</label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix">{phonePrefix}</span>
                    <input
                      className="input input-prefix-field"
                      inputMode="numeric"
                      pattern="\d{9}"
                      maxLength={9}
                      value={formatPhoneForDisplay(form.authorizedSignatory.phone)}
                      onChange={(e) => updateSignatory("phone", formatPhoneForStorage(e.target.value))}
                      placeholder="24xxxxxxx"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.authorizedSignatory.email}
                    onChange={(e) => updateSignatory("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.authorizedSignatory.date}
                    onChange={(e) => updateSignatory("date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                Contact Person
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={form.contactPerson.name}
                    onChange={(e) => updateContact("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Designation</label>
                  <input
                    className="input"
                    value={form.contactPerson.designation}
                    onChange={(e) => updateContact("designation", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Phone</label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix">{phonePrefix}</span>
                    <input
                      className="input input-prefix-field"
                      inputMode="numeric"
                      pattern="\d{9}"
                      maxLength={9}
                      value={formatPhoneForDisplay(form.contactPerson.phone)}
                      onChange={(e) => updateContact("phone", formatPhoneForStorage(e.target.value))}
                      placeholder="24xxxxxxx"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.contactPerson.email}
                    onChange={(e) => updateContact("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.contactPerson.date}
                    onChange={(e) => updateContact("date", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: PEP Declaration */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Politically Exposed Person (PEP) Declaration
            </p>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Q1: Are you or any of your directors/shareholders a politically exposed person?
              </p>
              <div className="flex gap-4">
                {["Yes", "No"].map((val) => (
                  <label key={val} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="pep-q1"
                      value={val}
                      checked={form.pepDeclaration.q1 === val}
                      onChange={(e) => updatePep("q1", e.target.value)}
                    />
                    {val}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Q2: Have you or any directors held a prominent public position in the last 12 months?
              </p>
              <div className="flex gap-4">
                {["Yes", "No"].map((val) => (
                  <label key={val} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="pep-q2"
                      value={val}
                      checked={form.pepDeclaration.q2 === val}
                      onChange={(e) => updatePep("q2", e.target.value)}
                    />
                    {val}
                  </label>
                ))}
              </div>
              {form.pepDeclaration.q2 === "Yes" && (
                <div className="space-y-1">
                  <label className="label">Time period / details</label>
                  <input
                    className="input"
                    value={form.pepDeclaration.q2Timeframe}
                    onChange={(e) => updatePep("q2Timeframe", e.target.value)}
                    placeholder="Specify timeframe or details"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Q3: Are you related to or closely associated with a PEP?
              </p>
              <div className="flex gap-4">
                {["Yes", "No"].map((val) => (
                  <label key={val} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="pep-q3"
                      value={val}
                      checked={form.pepDeclaration.q3 === val}
                      onChange={(e) => updatePep("q3", e.target.value)}
                    />
                    {val}
                  </label>
                ))}
              </div>
              {form.pepDeclaration.q3 === "Yes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="label">Name of PEP</label>
                    <input
                      className="input"
                      value={form.pepDeclaration.q3Name}
                      onChange={(e) => updatePep("q3Name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label">Position held</label>
                    <input
                      className="input"
                      value={form.pepDeclaration.q3Position}
                      onChange={(e) => updatePep("q3Position", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label">Year</label>
                    <input
                      className="input"
                      value={form.pepDeclaration.q3Year}
                      onChange={(e) => updatePep("q3Year", e.target.value)}
                      placeholder="YYYY"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label">Relationship</label>
                    <select
                      className="input"
                      value={form.pepDeclaration.q3Relationship}
                      onChange={(e) => updatePep("q3Relationship", e.target.value)}
                    >
                      <option value="">Select relationship</option>
                      <option value="Child">Child</option>
                      <option value="Close Associate">Close Associate</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload up to 5 photos of the business premises.
            </p>

            {form.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-[var(--border)]"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(i)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.imageUrls.length < 5 && (
              <UploadField
                label="Business Photo"
                accept={IMAGE_ACCEPT}
                uploading={uploading.photos}
                onSelect={handleImageUpload}
                helperText={`${form.imageUrls.length}/5 photos uploaded`}
              />
            )}
          </div>
        )}

        {/* Step 5: Review & Sign */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="card-flat p-4 space-y-3">
              <h3 className="text-sm font-semibold">Company Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Business Name</span>
                <span>{form.businessName || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Region</span>
                <span>{ghanaLocations[form.regionCode]?.name ?? (form.regionCode || "—")}</span>
                <span className="text-gray-500 dark:text-gray-400">Business Type</span>
                <span>
                  {form.businessType === "Other"
                    ? form.businessTypeOther || "Other"
                    : form.businessType || "—"}
                </span>
                <span className="text-gray-500 dark:text-gray-400">Registration No.</span>
                <span>{form.registrationCertNo || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">TIN</span>
                <span>{form.tinNumber || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Company Phone</span>
                <span>{form.companyPhone || "—"}</span>
              </div>
            </div>

            <div className="card-flat p-4 space-y-3">
              <h3 className="text-sm font-semibold">Authorized Signatory</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span>{form.authorizedSignatory.name || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Designation</span>
                <span>{form.authorizedSignatory.designation || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <span>{form.authorizedSignatory.phone || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span>{form.authorizedSignatory.email || "—"}</span>
              </div>
            </div>

            <div className="card-flat p-4 space-y-3">
              <h3 className="text-sm font-semibold">PEP Declaration</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Q1: Is PEP</span>
                <span>{form.pepDeclaration.q1 || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Q2: Held public position</span>
                <span>{form.pepDeclaration.q2 || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Q3: Related to PEP</span>
                <span>{form.pepDeclaration.q3 || "—"}</span>
              </div>
            </div>

            {form.imageUrls.length > 0 && (
              <div className="card-flat p-4 space-y-3">
                <h3 className="text-sm font-semibold">Photos ({form.imageUrls.length})</h3>
                <div className="flex gap-2 overflow-x-auto">
                  {form.imageUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="label">Comments (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={form.comments}
                onChange={(e) => updateField("comments", e.target.value)}
                placeholder="Any additional comments for the manager..."
              />
            </div>

            <div className="space-y-1">
              <label className="label">Completion Date</label>
              <input
                className="input"
                type="date"
                value={form.completionDate}
                onChange={(e) => updateField("completionDate", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="label">Signature</label>
              <SignaturePad
                existingSignatureUrl={form.signatureUrl || undefined}
                onSignatureReady={(url) => updateField("signatureUrl", url)}
                onClear={() => updateField("signatureUrl", "")}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={handleSaveDraft}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary text-sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary text-sm"
                onClick={handleSubmit}
                disabled={loading || !form.businessName.trim() || !form.regionCode}
              >
                {loading ? "Submitting..." : "Submit to Manager"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
