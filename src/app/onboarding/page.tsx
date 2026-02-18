"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import PostAuthToast, { storeToast } from "@/components/post-auth-toast";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { uploadFile } from "@/lib/storage/upload-client";
import UploadField from "@/components/upload-field";
import FilePreviewModal from "@/components/file-preview-modal";
import { DOCUMENT_ACCEPT, IMAGE_ACCEPT } from "@/lib/storage/accepts";
import { ghanaLocations, GREATER_ACCRA_REGION_CODE, GREATER_ACCRA_SBUS } from "@/lib/ghana-locations";

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
    title: "Partner Details",
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
      { key: "regionCode", label: "Region", type: "select" },
      { key: "passportPhotoUrl", label: "Passport Photo", type: "upload", accept: IMAGE_ACCEPT },
    ],
  },
  {
    id: "business",
    title: "Business Details",
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
      { key: "ghanaCardNumber", label: "Ghana Card Number", type: "text" },
      { key: "paymentWallet", label: "Payment Wallet", type: "text" },
      {
        key: "businessCertificateUrl",
        label: "Business Certificate",
        type: "upload",
        accept: DOCUMENT_ACCEPT,
      },
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

function parseGhanaCard(value?: string) {
  const raw = value ?? "";
  const match = raw.match(/^([A-Za-z]{0,3})-?(\d{0,9})-?(\d?)$/);
  if (!match) {
    // Try to extract what we can
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
  const { data: session } = useSession();
  const draftKey = session?.user?.email
    ? `partnerOnboardingDraft:${session.user.email}`
    : null;
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

  const regionOptions = useMemo(() => {
    return Object.values(ghanaLocations)
      .map((region) => ({
        value: region.code,
        label: region.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const missingFields = useMemo(() => {
    const missing = allFieldKeys.filter((key) => {
      if (phoneKeys.has(key)) {
        return formatPhoneForDisplay(form[key]).length !== 9;
      }
      const value = form[key];
      return !value || value.trim() === "";
    });
    // Also check regionCode (already in allFieldKeys)
    // Conditionally require sbuCode for Greater Accra
    if (form.regionCode === GREATER_ACCRA_REGION_CODE && (!form.sbuCode || form.sbuCode.trim() === "")) {
      missing.push("sbuCode");
    }
    return missing;
  }, [form]);

  useEffect(() => {
    if (!draftKey) return;

    async function loadDraft() {
      // Clean up legacy unscoped key from before per-user fix
      window.localStorage.removeItem("partnerOnboardingDraft");

      const localDraft = window.localStorage.getItem(draftKey!);
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft) as Record<string, string>;
          setForm(parsed);
        } catch {
          window.localStorage.removeItem(draftKey!);
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
        // Load all known field keys plus sbuCode (not in steps but needed)
        const keysToLoad = [...allFieldKeys, "sbuCode"];
        for (const key of keysToLoad) {
          next[key] = data.profile[key] ?? "";
        }
        setForm(next);
        if (data.profile.status && data.profile.status !== "DRAFT") {
          setSubmitted(true);
        }
      }
    }

    loadDraft();
  }, [draftKey]);

  function updateField(key: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (draftKey) window.localStorage.setItem(draftKey, JSON.stringify(next));
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
      if (draftKey) window.localStorage.setItem(draftKey, JSON.stringify(form));
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
      if (draftKey) window.localStorage.removeItem(draftKey);
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
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h1 className="text-2xl font-semibold onboarding-title">
            <span className="onboarding-title-icon">{step.icon}</span>
            {step.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
        </div>

        <div className="grid gap-2 md:grid-cols-2 stagger">
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

            if (field.key === "regionCode") {
              return (
                <div key={field.key}>
                  <div className="space-y-1">
                    <label className="label">{field.label}</label>
                    <select
                      className="input"
                      value={form.regionCode ?? ""}
                      onChange={(event) => {
                        updateField("regionCode", event.target.value);
                        updateField("sbuCode", "");
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
                  {form.regionCode === GREATER_ACCRA_REGION_CODE && (
                    <div className="space-y-1 mt-4">
                      <label className="label">Strategic Business Unit (SBU)</label>
                      <select
                        className="input"
                        value={form.sbuCode ?? ""}
                        onChange={(e) => updateField("sbuCode", e.target.value)}
                      >
                        <option value="">Select SBU</option>
                        {GREATER_ACCRA_SBUS.map((sbu) => (
                          <option key={sbu.code} value={sbu.code}>
                            {sbu.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            }

            if (field.key === "ghanaCardNumber") {
              const gc = parseGhanaCard(form.ghanaCardNumber);
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
                    />
                  </div>
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
                ) : (
                  <input
                    className="input"
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    required
                  />
                )}
                {field.hint ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
