"use client";

import { useCallback, useMemo, useState } from "react";

import { ghanaLocations, GREATER_ACCRA_SBUS, GREATER_ACCRA_REGION_CODE } from "@/lib/ghana-locations";
import {
  type OnboardRequestFormData,
  INITIAL_FORM,
  BUSINESS_TYPES,
  REGISTERED_NATURES,
} from "@/lib/onboard-request-constants";

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
  { label: "Review & Submit", icon: "clipboard" },
] as const;

type PublicFormData = Omit<OnboardRequestFormData, "imageUrls" | "completionDate" | "comments" | "signatureUrl"> & {
  submitterName: string;
  submitterPhone: string;
  submitterEmail: string;
};

const INITIAL_PUBLIC_FORM: PublicFormData = {
  ...INITIAL_FORM,
  submitterName: "",
  submitterPhone: "",
  submitterEmail: "",
};

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

export default function PublicOnboardRequestPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PublicFormData>(INITIAL_PUBLIC_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const regionOptions = useMemo(
    () =>
      Object.entries(ghanaLocations)
        .map(([code, region]) => ({
          value: code,
          label: region.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const updateField = useCallback((key: keyof PublicFormData, value: unknown) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Clear SBU when region changes away from Greater Accra
      if (key === "regionCode" && value !== GREATER_ACCRA_REGION_CODE) {
        next.sbuCode = "";
      }
      return next;
    });
  }, []);

  const updateSignatory = useCallback((field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      authorizedSignatory: { ...prev.authorizedSignatory, [field]: value },
    }));
  }, []);

  const updateContact = useCallback((field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      contactPerson: { ...prev.contactPerson, [field]: value },
    }));
  }, []);

  const updatePep = useCallback((field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      pepDeclaration: { ...prev.pepDeclaration, [field]: value },
    }));
  }, []);

  async function handleSubmit() {
    if (!form.submitterName.trim() || !form.submitterPhone.trim()) {
      setError("Your name and phone number are required");
      return;
    }
    if (!form.businessName.trim() || !form.regionCode) {
      setError("Business name and region are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/public/onboard-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterName: form.submitterName,
          submitterPhone: form.submitterPhone,
          submitterEmail: form.submitterEmail || undefined,
          businessName: form.businessName,
          regionCode: form.regionCode,
          sbuCode: form.sbuCode || undefined,
          dateOfIncorporation: form.dateOfIncorporation || undefined,
          businessType: form.businessType || undefined,
          businessTypeOther: form.businessTypeOther || undefined,
          registeredNature: form.registeredNature || undefined,
          registrationCertNo: form.registrationCertNo || undefined,
          mainOfficeLocation: form.mainOfficeLocation || undefined,
          tinNumber: form.tinNumber || undefined,
          postalAddress: form.postalAddress || undefined,
          physicalAddress: form.physicalAddress || undefined,
          companyPhone: form.companyPhone || undefined,
          digitalPostAddress: form.digitalPostAddress || undefined,
          authorizedSignatory: form.authorizedSignatory,
          contactPerson: form.contactPerson,
          pepDeclaration: form.pepDeclaration,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-4xl glass-panel p-6 page-animate text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">Submission Received</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Thank you for submitting your onboard request. A regional coordinator will review your submission and follow up with you shortly.
          </p>
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={() => {
              setSubmitted(false);
              setForm(INITIAL_PUBLIC_FORM);
              setStep(0);
            }}
          >
            Submit Another Request
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">MCS Partner Onboard Request</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fill in the details below to submit a partner onboard request.
          </p>
        </div>

        {/* Step indicator */}
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
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
          <div className="space-y-6">
            {/* Submitter Info */}
            <div className="card-flat p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                Your Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label">
                    Your Name                  </label>
                  <input
                    className="input"
                    value={form.submitterName}
                    onChange={(e) => updateField("submitterName", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="label">
                    Phone Number                  </label>
                  <div className="input-prefix-wrap">
                    <span className="input-prefix">{phonePrefix}</span>
                    <input
                      className="input input-prefix-field"
                      inputMode="numeric"
                      pattern="\d{9}"
                      maxLength={9}
                      value={formatPhoneForDisplay(form.submitterPhone)}
                      onChange={(e) => updateField("submitterPhone", formatPhoneForStorage(e.target.value))}
                      placeholder="24xxxxxxx"
                    />
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="label">Email (optional)</label>
                  <input
                    className="input"
                    type="email"
                    value={form.submitterEmail}
                    onChange={(e) => updateField("submitterEmail", e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Company fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="label">
                  Business Name                </label>
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
                <label className="label">
                  Region                </label>
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

              {form.regionCode === GREATER_ACCRA_REGION_CODE && (
                <div className="space-y-1">
                  <label className="label">Strategic Business Unit (SBU)</label>
                  <select
                    className="input"
                    value={form.sbuCode}
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

        {/* Step 4: Review & Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="card-flat p-4 space-y-3">
              <h3 className="text-sm font-semibold">Your Contact Information</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span>{form.submitterName || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <span>{form.submitterPhone || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span>{form.submitterEmail || "—"}</span>
              </div>
            </div>

            <div className="card-flat p-4 space-y-3">
              <h3 className="text-sm font-semibold">Company Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Business Name</span>
                <span>{form.businessName || "—"}</span>
                <span className="text-gray-500 dark:text-gray-400">Region</span>
                <span>{ghanaLocations[form.regionCode]?.name ?? (form.regionCode || "—")}</span>
                {form.regionCode === GREATER_ACCRA_REGION_CODE && form.sbuCode && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">SBU</span>
                    <span>{GREATER_ACCRA_SBUS.find((s) => s.code === form.sbuCode)?.name || form.sbuCode}</span>
                  </>
                )}
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
                {form.pepDeclaration.q2 === "Yes" && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Q2: Timeframe</span>
                    <span>{form.pepDeclaration.q2Timeframe || "—"}</span>
                  </>
                )}
                <span className="text-gray-500 dark:text-gray-400">Q3: Related to PEP</span>
                <span>{form.pepDeclaration.q3 || "—"}</span>
                {form.pepDeclaration.q3 === "Yes" && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Q3: PEP Name</span>
                    <span>{form.pepDeclaration.q3Name || "—"}</span>
                    <span className="text-gray-500 dark:text-gray-400">Q3: Position</span>
                    <span>{form.pepDeclaration.q3Position || "—"}</span>
                    <span className="text-gray-500 dark:text-gray-400">Q3: Year</span>
                    <span>{form.pepDeclaration.q3Year || "—"}</span>
                    <span className="text-gray-500 dark:text-gray-400">Q3: Relationship</span>
                    <span>{form.pepDeclaration.q3Relationship || "—"}</span>
                  </>
                )}
              </div>
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
                disabled={
                  loading ||
                  !form.businessName.trim() ||
                  !form.regionCode ||
                  !form.submitterName.trim() ||
                  !form.submitterPhone.trim()
                }
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
