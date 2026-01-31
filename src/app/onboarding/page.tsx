"use client";

import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import {
  buildAddressCode,
  isAddressCodeComplete,
  parseAddressCode,
} from "@/lib/ghana-post-gps";
import { ghanaLocations } from "@/lib/ghana-locations";
import PostAuthToast, { storeToast } from "@/components/post-auth-toast";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { uploadFile } from "@/lib/storage/upload-client";
import UploadField from "@/components/upload-field";
import FilePreviewModal from "@/components/file-preview-modal";
import { DOCUMENT_ACCEPT, IMAGE_ACCEPT } from "@/lib/storage/accepts";

type FieldType = "text" | "select" | "upload";

type Field = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  accept?: string;
  hint?: string;
  hintLink?: string;
};

type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: Field[];
};

const steps: Step[] = [
  {
    id: "partner",
    title: "Partner Identity",
    description: "Tell us who owns this MTN Community Shop.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          fill="currentColor"
        />
        <path
          d="M4 20a6 6 0 0 1 12 0v1H4v-1Z"
          fill="currentColor"
        />
        <path
          d="M18.5 20.5v-1a4.5 4.5 0 0 0-2.7-4.12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
    fields: [
      { key: "partnerFirstName", label: "First Name", type: "text" },
      { key: "partnerSurname", label: "Surname", type: "text" },
      { key: "phoneNumber", label: "Phone Number", type: "text" },
      { key: "passportPhotoUrl", label: "Passport Photo", type: "upload", accept: IMAGE_ACCEPT },
    ],
  },
  {
    id: "business",
    title: "Business Identity",
    description: "Provide the business details and compliance documents.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Z"
          fill="currentColor"
        />
        <path
          d="M3 10l4-6h10l4 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    fields: [
      { key: "businessName", label: "Business Name", type: "text" },
      { key: "taxIdentityNumber", label: "Tax Identity Number", type: "text" },
      {
        key: "businessCertificateUrl",
        label: "Business Certificate",
        type: "upload",
        accept: DOCUMENT_ACCEPT,
      },
      {
        key: "fireCertificateUrl",
        label: "Fire Certificate",
        type: "upload",
        accept: DOCUMENT_ACCEPT,
      },
      {
        key: "insuranceUrl",
        label: "Insurance Document",
        type: "upload",
        accept: DOCUMENT_ACCEPT,
      },
    ],
  },
  {
    id: "ids",
    title: "Government IDs",
    description: "Provide Ghana card details.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" />
        <path
          d="M7 12h4M7 15h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
    fields: [
      { key: "ghanaCardNumber", label: "Ghana Card Number", type: "text" },
      { key: "ghanaCardFrontUrl", label: "Ghana Card Front", type: "upload", accept: IMAGE_ACCEPT },
      { key: "ghanaCardBackUrl", label: "Ghana Card Back", type: "upload", accept: IMAGE_ACCEPT },
    ],
  },
  {
    id: "location",
    title: "Location",
    description: "Capture the digital address and GPS location.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M12 3a6 6 0 0 1 6 6c0 4.5-6 12-6 12S6 13.5 6 9a6 6 0 0 1 6-6Z"
          fill="currentColor"
        />
        <circle cx="12" cy="9" r="2.5" fill="#0b0c0f" />
      </svg>
    ),
    fields: [
      { key: "addressRegionCode", label: "Region", type: "select" },
      { key: "addressDistrictCode", label: "District", type: "select" },
      {
        key: "addressCode",
        label: "Digital Address Code",
        type: "text",
        placeholder: "123-4567",
        hint: "Get this from the GhanaPostGPS app.",
        hintLink: "https://ghanapostgps.com/",
      },
      {
        key: "gpsLatitude",
        label: "GPS Latitude",
        type: "text",
        hint: "Use the GhanaPostGPS app to copy coordinates.",
        hintLink: "https://ghanapostgps.com/",
      },
      {
        key: "gpsLongitude",
        label: "GPS Longitude",
        type: "text",
        hint: "Use the GhanaPostGPS app to copy coordinates.",
        hintLink: "https://ghanapostgps.com/",
      },
      { key: "city", label: "City/Town", type: "text" },
      { key: "landmark", label: "Directional Address (Landmark)", type: "text" },
    ],
  },
  {
    id: "store",
    title: "Store & Assets",
    description: "Provide store photos and device assets.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"
          fill="currentColor"
        />
        <path
          d="M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
    fields: [
      { key: "storeFrontUrl", label: "Store Front Photo", type: "upload", accept: IMAGE_ACCEPT },
      { key: "storeInsideUrl", label: "Store Inside Photo", type: "upload", accept: IMAGE_ACCEPT },
      { key: "paymentWallet", label: "Payment Wallet", type: "text" },
      { key: "apn", label: "APN", type: "text" },
      { key: "mifiImei", label: "MiFi/Router IMEI", type: "text" },
    ],
  },
];

const allFieldKeys = steps.flatMap((step) => step.fields.map((field) => field.key));
const phonePrefix = "+233";
const phoneKeys = new Set(["phoneNumber", "paymentWallet"]);

function formatPhoneForStorage(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  return digits ? `${phonePrefix}${digits}` : "";
}

function formatPhoneForDisplay(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  const withoutPrefix = digits.startsWith("233") ? digits.slice(3) : digits;
  return withoutPrefix.length > 9 ? withoutPrefix.slice(-9) : withoutPrefix;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const missingFields = useMemo(() => {
    return allFieldKeys.filter((key) => {
      if (phoneKeys.has(key)) {
        return formatPhoneForDisplay(form[key]).length !== 9;
      }
      if (key === "addressCode") {
        return !isAddressCodeComplete(form[key]);
      }
      const value = form[key];
      return !value || value.trim() === "";
    });
  }, [form]);

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

  useEffect(() => {
    async function loadDraft() {
      const localDraft = window.localStorage.getItem("partnerOnboardingDraft");
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft) as Record<string, string>;
          setForm(parsed);
        } catch {
          window.localStorage.removeItem("partnerOnboardingDraft");
        }
      }

      const response = await fetch("/api/partner/onboarding");
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data.profile) {
        if (data.profile.status === "APPROVED") {
          window.location.replace("/partner/dashboard");
          return;
        }
        const next: Record<string, string> = {};
        for (const key of allFieldKeys) {
          next[key] = data.profile[key] ?? "";
        }
        setForm(next);
        if (data.profile.status && data.profile.status !== "DRAFT") {
          setSubmitted(true);
        }
      }
    }

    loadDraft();
  }, []);

  function updateField(key: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      window.localStorage.setItem("partnerOnboardingDraft", JSON.stringify(next));
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    setStatus(null);
    setError(null);

    const response = await fetch("/api/partner/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to save draft.");
      notify({ title: "Draft not saved", message: data.error ?? "Check the form fields.", kind: "error" });
    } else {
      setStatus("Draft saved.");
      window.localStorage.setItem("partnerOnboardingDraft", JSON.stringify(form));
      notify({ title: "Draft saved", message: "Your progress has been saved.", kind: "success" });
    }

    setLoading(false);
  }

  async function handleUpload(fieldKey: string, file: File) {
    setUploading((prev) => ({ ...prev, [fieldKey]: true }));
    setError(null);

    try {
      const pathname = `onboarding/${fieldKey}-${Date.now()}-${file.name}`;
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

  async function handleSubmit() {
    if (missingFields.length > 0) {
      const message = `Please complete all required fields before submitting. (${missingFields.length} missing)`;
      setError(message);
      notify({ title: "Submission blocked", message, kind: "warning" });
      return;
    }

    setLoading(true);
    setStatus(null);
    setError(null);

    // Save form data first to ensure profile exists
    const saveResponse = await fetch("/api/partner/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!saveResponse.ok) {
      const data = await saveResponse.json().catch(() => ({}));
      setError(data.error ?? "Unable to save before submission.");
      notify({ title: "Submission failed", message: data.error ?? "Could not save form data.", kind: "error" });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/partner/onboarding/submit", {
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data.missing
        ? `Missing fields: ${data.missing.join(", ")}`
        : data.error;
      setError(message ?? "Unable to submit.");
      notify({ title: "Submission failed", message: message ?? "Please complete all required fields.", kind: "error" });
    } else {
      setStatus(null);
      setSubmitted(true);
      notify({ title: "Submitted", message: "Your onboarding is now under review.", kind: "success" });
    }

    setLoading(false);
  }

  function goNext() {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function goBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  const step = steps[currentStep];

  return (
    <main className="min-h-screen px-6 py-10">
      <PostAuthToast />
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h1 className="text-2xl font-semibold onboarding-title">
            <span className="onboarding-title-icon">{step.icon}</span>
            {step.title}
          </h1>
          <p className="text-sm text-gray-600">{step.description}</p>
        </div>

        <div className="grid gap-2 md:grid-cols-5 stagger">
          {steps.map((item, index) => (
            <button
              key={item.id}
              className={`onboarding-step ${index === currentStep ? "onboarding-step-active" : ""}`}
              type="button"
              onClick={() => setCurrentStep(index)}
            >
              <span className="onboarding-step-icon">{item.icon}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {step.fields.map((field) => {
            if (field.type === "upload") {
              const isImageOnly = field.accept === IMAGE_ACCEPT;
              return (
                <UploadField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  accept={field.accept}
                  uploading={uploading[field.key]}
                  onPreview={(url, anchorRect) =>
                    setPreview({
                      url,
                      label: field.label,
                      kind: isImageOnly ? "image" : "pdf",
                      anchorRect: anchorRect ?? null,
                    })
                  }
                  onSelect={(file) => handleUpload(field.key, file)}
                />
              );
            }

            if (field.type === "select") {
              const options =
                field.key === "addressRegionCode" ? regionOptions : districtOptions;

              return (
                <div key={field.key} className="space-y-2">
                  <label className="label">{field.label}</label>
                  <select
                    className="input"
                    value={form[field.key] ?? ""}
                    onChange={(event) => {
                      updateField(field.key, event.target.value);
                      if (field.key === "addressRegionCode") {
                        updateField("addressDistrictCode", "");
                        updateField("addressCode", "");
                      }
                      if (field.key === "addressDistrictCode") {
                        updateField("addressCode", "");
                      }
                    }}
                    disabled={
                      field.key === "addressDistrictCode" && !form.addressRegionCode
                    }
                    required
                  >
                    <option value="">Select</option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {field.key === "addressRegionCode" ? (
                    <p className="text-xs text-gray-500">
                      Region determines available districts.
                    </p>
                  ) : null}
                </div>
              );
            }

            return (
              <div key={field.key} className="space-y-1">
                <label className="label">{field.label}</label>
                {phoneKeys.has(field.key) ? (
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
                      required
                    />
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
                      disabled={!form.addressDistrictCode}
                      required
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
                      disabled={!form.addressDistrictCode}
                      required
                    />
                  </div>
                ) : field.key === "apn" || field.key === "mifiImei" ? (
                  <input
                    className="input"
                    inputMode="numeric"
                    pattern="\\d*"
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(event) =>
                      updateField(field.key, event.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                ) : (
                  <input
                    className="input"
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    required
                  />
                )}
                {field.hint && !(step.id === "location" && field.hintLink) ? (
                  <p className="text-xs text-gray-500">
                    {field.hint}
                    {field.hintLink ? (
                      <>
                        {" "}
                        <a href={field.hintLink} target="_blank" rel="noreferrer" className="link-accent">
                          Download app
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            );
          })}
          {step.id === "location" ? (
            <p className="text-xs text-gray-500">
              Get the digital address code and GPS coordinates from the GhanaPostGPS app.{" "}
              <a href="https://ghanapostgps.com/" target="_blank" rel="noreferrer" className="link-accent">
                Download app
              </a>
            </p>
          ) : null}
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {status ? <p className="form-message form-message-success">{status}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save draft"}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            Back
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={goNext}
              disabled={submitted}
            >
              Next
            </button>
          ) : (
            <button
              className={`btn btn-primary ${missingFields.length > 0 ? "opacity-60 cursor-not-allowed" : ""}`}
              type="button"
              onClick={handleSubmit}
              disabled={loading || missingFields.length > 0 || submitted}
            >
              Submit for review
            </button>
          )}
        </div>
      </div>
      {submitted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="relative w-full max-w-md space-y-4 text-center glass-panel p-6">
            <h2 className="text-2xl font-semibold">Submission Received</h2>
            <p className="text-sm text-gray-600">
              Your submission is under review. You will be notified once there is a response from the admin team.
            </p>
            <button
              className="btn btn-primary w-full"
              type="button"
              onClick={() => {
                storeToast({
                  title: "Signed out",
                  message: "You have been logged out.",
                  kind: "info",
                });
                signOut({ callbackUrl: "/partner/login" });
              }}
            >
              Log out
            </button>
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
