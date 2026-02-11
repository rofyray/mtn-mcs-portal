"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { useAdmin, useAdminRole } from "@/contexts/admin-context";
import { useToast } from "@/components/toast";
import { ghanaLocations } from "@/lib/ghana-locations";
import { uploadFile } from "@/lib/storage/upload-client";
import UploadField from "@/components/upload-field";
import { IMAGE_ACCEPT } from "@/lib/storage/accepts";

const SignaturePad = dynamic(() => import("@/components/signature-pad"));
const ConfirmModal = dynamic(() => import("@/components/confirm-modal"));

type Approval = {
  id: string;
  adminId: string;
  role: string;
  action: string;
  comments: string | null;
  signatureUrl: string | null;
  signatureDate: string | null;
  governanceScore: number | null;
  createdAt: string;
  admin: { id: string; name: string; role: string };
};

type FormDetail = {
  id: string;
  status: string;
  createdByAdminId: string | null;
  regionCode: string;
  businessName: string;
  dateOfIncorporation: string | null;
  businessType: string | null;
  businessTypeOther: string | null;
  registeredNature: string | null;
  registrationCertNo: string | null;
  mainOfficeLocation: string | null;
  tinNumber: string | null;
  postalAddress: string | null;
  physicalAddress: string | null;
  companyPhone: string | null;
  digitalPostAddress: string | null;
  authorizedSignatory: Record<string, string> | null;
  contactPerson: Record<string, string> | null;
  pepDeclaration: Record<string, string> | null;
  imageUrls: string[];
  completionDate: string | null;
  createdAt: string;
  createdByAdmin: { id: string; name: string; role: string } | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterPhone: string | null;
  approvals: Approval[];
};

const ROLE_LABELS: Record<string, string> = {
  FULL: "Full Access",
  MANAGER: "Manager",
  COORDINATOR: "Coordinator",
  SENIOR_MANAGER: "Senior Manager",
  GOVERNANCE: "Governance",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  COORDINATOR: "badge-yellow-light",
  MANAGER: "badge-primary",
  SENIOR_MANAGER: "badge-blue-light",
  GOVERNANCE: "badge-blue",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "dr-status dr-status-draft";
    case "PENDING_COORDINATOR":
    case "PENDING_MANAGER":
    case "PENDING_SENIOR_MANAGER":
    case "PENDING_GOVERNANCE_CHECK":
      return "dr-status dr-status-pending";
    case "APPROVED":
      return "dr-status dr-status-approved";
    case "DENIED":
      return "dr-status dr-status-denied";
    default:
      return "dr-status";
  }
}

export default function OnboardRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { admin } = useAdmin();
  const { isCoordinator } = useAdminRole();
  const { notify } = useToast();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Action panel state
  const [comments, setComments] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [governanceScore, setGovernanceScore] = useState("");

  // Coordinator review state
  const [coordImageUrls, setCoordImageUrls] = useState<string[]>([]);
  const [coordComments, setCoordComments] = useState("");
  const [coordCompletionDate, setCoordCompletionDate] = useState("");
  const [coordSignatureUrl, setCoordSignatureUrl] = useState("");
  const [coordUploading, setCoordUploading] = useState(false);

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<"approve" | "deny" | null>(null);

  const fetchForm = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/onboard-requests/${params.id}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setForm(data.form);
    } catch {
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // Determine if current admin can take action
  const canAct =
    form &&
    admin &&
    ((form.status === "PENDING_MANAGER" && admin.role === "MANAGER") ||
      (form.status === "PENDING_SENIOR_MANAGER" && admin.role === "SENIOR_MANAGER") ||
      (form.status === "PENDING_GOVERNANCE_CHECK" && admin.role === "GOVERNANCE"));

  const canEditDenied =
    form &&
    isCoordinator &&
    form.status === "DENIED" &&
    form.createdByAdminId === admin?.id;

  const canCoordinatorAct =
    form &&
    admin &&
    form.status === "PENDING_COORDINATOR" &&
    admin.role === "COORDINATOR" &&
    admin.regions.some((r: { regionCode: string }) => r.regionCode === form.regionCode);

  const isGovernanceStage = form?.status === "PENDING_GOVERNANCE_CHECK";

  async function handleApprove() {
    if (!form) return;
    if (!signatureUrl) {
      notify({ title: "Signature required", message: "Please add your signature before approving.", kind: "warning" });
      setConfirmAction(null);
      return;
    }
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        comments: comments || undefined,
        signatureUrl: signatureUrl || undefined,
        signatureDate: signatureDate || new Date().toISOString(),
      };
      if (isGovernanceStage) {
        const score = Number(governanceScore);
        if (!score || score < 1 || score > 100) {
          notify({ title: "Invalid score", message: "Governance score must be 1-100.", kind: "error" });
          setActionLoading(false);
          setConfirmAction(null);
          return;
        }
        body.governanceScore = score;
      }

      const response = await fetch(`/api/admin/onboard-requests/${form.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Action failed");
      }

      notify({
        title: "Approved",
        message: isGovernanceStage
          ? "Onboard request has been fully approved."
          : "Onboard request forwarded to next stage.",
        kind: "success",
      });
      fetchForm();
    } catch (err) {
      notify({
        title: "Error",
        message: err instanceof Error ? err.message : "Action failed",
        kind: "error",
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleDeny() {
    if (!form) return;
    if (!comments.trim()) {
      notify({
        title: "Comments required",
        message: "Please provide a reason for denial.",
        kind: "warning",
      });
      setConfirmAction(null);
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/onboard-requests/${form.id}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comments,
          signatureUrl: signatureUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Denial failed");
      }

      notify({ title: "Denied", message: "Onboard request has been denied.", kind: "warning" });
      fetchForm();
    } catch (err) {
      notify({
        title: "Error",
        message: err instanceof Error ? err.message : "Denial failed",
        kind: "error",
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate panel-loading">
          <span className="panel-spinner" aria-label="Loading" />
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-4xl glass-panel p-6 page-animate">
          <p className="text-sm text-red-500">Onboard request not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-5 glass-panel p-6 page-animate">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{form.businessName}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {ghanaLocations[form.regionCode]?.name ?? form.regionCode} &middot;{" "}
            {form.createdByAdmin
              ? `Created by ${form.createdByAdmin.name}`
              : form.submitterName
              ? `Submitted by ${form.submitterName}`
              : "Public submission"}{" "}
            &middot; {formatDate(form.createdAt)}
          </p>
        </div>
        <span className={getStatusClass(form.status)}>
          {formatStatusLabel(form.status)}
        </span>
      </div>

      {canEditDenied && (
        <button
          type="button"
          className="btn btn-primary text-sm"
          onClick={() => router.push(`/admin/onboard-requests/new?id=${form.id}`)}
        >
          Edit &amp; Resubmit
        </button>
      )}

      {/* Submitter Information */}
      {form.submitterName && (
        <section className="card-flat p-4 space-y-3">
          <h3 className="text-sm font-semibold">Submitter Information</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Name</span>
            <span>{form.submitterName}</span>
            {form.submitterPhone && (
              <>
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <span>{form.submitterPhone}</span>
              </>
            )}
            {form.submitterEmail && (
              <>
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span>{form.submitterEmail}</span>
              </>
            )}
          </div>
        </section>
      )}

      {/* Company Details */}
      <section className="card-flat p-4 space-y-3">
        <h3 className="text-sm font-semibold">Company Details</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Business Name</span>
          <span>{form.businessName}</span>
          <span className="text-gray-500 dark:text-gray-400">Date of Incorporation</span>
          <span>{formatDate(form.dateOfIncorporation)}</span>
          <span className="text-gray-500 dark:text-gray-400">Business Type</span>
          <span>
            {form.businessType === "Other"
              ? form.businessTypeOther ?? "Other"
              : form.businessType ?? "—"}
          </span>
          <span className="text-gray-500 dark:text-gray-400">Registered Nature</span>
          <span>{form.registeredNature ?? "—"}</span>
          <span className="text-gray-500 dark:text-gray-400">Registration No.</span>
          <span>{form.registrationCertNo ?? "—"}</span>
          <span className="text-gray-500 dark:text-gray-400">Main Office</span>
          <span>{form.mainOfficeLocation ?? "—"}</span>
          <span className="text-gray-500 dark:text-gray-400">TIN</span>
          <span>{form.tinNumber ?? "—"}</span>
          <span className="text-gray-500 dark:text-gray-400">Postal Address</span>
          <span>{form.postalAddress ?? "—"}</span>
          <span className="text-gray-500 dark:text-gray-400">Physical Address</span>
          <span>{form.physicalAddress ?? "—"}</span>
          <span className="text-gray-500 dark:text-gray-400">Phone</span>
          <span>{form.companyPhone ?? "—"}</span>
          <span className="text-gray-500 dark:text-gray-400">Digital Post Address</span>
          <span>{form.digitalPostAddress ?? "—"}</span>
        </div>
      </section>

      {/* Authorized Signatory */}
      {form.authorizedSignatory && (
        <section className="card-flat p-4 space-y-3">
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
        </section>
      )}

      {/* Contact Person */}
      {form.contactPerson && (
        <section className="card-flat p-4 space-y-3">
          <h3 className="text-sm font-semibold">Contact Person</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Name</span>
            <span>{form.contactPerson.name || "—"}</span>
            <span className="text-gray-500 dark:text-gray-400">Designation</span>
            <span>{form.contactPerson.designation || "—"}</span>
            <span className="text-gray-500 dark:text-gray-400">Phone</span>
            <span>{form.contactPerson.phone || "—"}</span>
            <span className="text-gray-500 dark:text-gray-400">Email</span>
            <span>{form.contactPerson.email || "—"}</span>
            <span className="text-gray-500 dark:text-gray-400">Date</span>
            <span>{form.contactPerson.date || "—"}</span>
          </div>
        </section>
      )}

      {/* PEP Declaration */}
      {form.pepDeclaration && (
        <section className="card-flat p-4 space-y-3">
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
        </section>
      )}

      {/* Photos */}
      {form.imageUrls.length > 0 && (
        <section className="card-flat p-4 space-y-3">
          <h3 className="text-sm font-semibold">Photos ({form.imageUrls.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {form.imageUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-[var(--border)]"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Completion Date */}
      {form.completionDate && (
        <section className="card-flat p-4">
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Completion Date: </span>
            <span>{formatDate(form.completionDate)}</span>
          </div>
        </section>
      )}

      {/* Coordinator Review Panel */}
      {canCoordinatorAct && (
        <section className="card-flat p-4 space-y-4 border-2 border-[var(--momo-blue)]">
          <h3 className="text-sm font-semibold">Coordinator Review</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload photos, add comments, and sign before submitting to the manager.
          </p>

          {/* Image upload */}
          <div className="space-y-3">
            <label className="label">Business Photos (up to 5)</label>
            {coordImageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {coordImageUrls.map((url, i) => (
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
                      onClick={() =>
                        setCoordImageUrls((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
            {coordImageUrls.length < 5 && (
              <UploadField
                label="Business Photo"
                accept={IMAGE_ACCEPT}
                uploading={coordUploading}
                onSelect={async (file: File) => {
                  setCoordUploading(true);
                  try {
                    const pathname = `onboarding/onboard-requests/photos/${Date.now()}-${file.name}`;
                    const result = await uploadFile({
                      file,
                      pathname,
                      contentType: file.type,
                    });
                    setCoordImageUrls((prev) => [...prev, result.url]);
                  } catch {
                    notify({
                      title: "Upload failed",
                      message: "Failed to upload image.",
                      kind: "error",
                    });
                  } finally {
                    setCoordUploading(false);
                  }
                }}
                helperText={`${coordImageUrls.length}/5 photos uploaded`}
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="label">Comments</label>
            <textarea
              className="input"
              rows={3}
              value={coordComments}
              onChange={(e) => setCoordComments(e.target.value)}
              placeholder="Add your comments..."
            />
          </div>

          <div className="space-y-1">
            <label className="label">Completion Date</label>
            <input
              className="input"
              type="date"
              value={coordCompletionDate}
              onChange={(e) => setCoordCompletionDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="label">Signature</label>
            <SignaturePad
              existingSignatureUrl={coordSignatureUrl || undefined}
              onSignatureReady={setCoordSignatureUrl}
              onClear={() => setCoordSignatureUrl("")}
              onError={(msg) => notify({ title: "Signature error", message: msg, kind: "error" })}
              disabled={actionLoading}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={async () => {
              if (!coordSignatureUrl) {
                notify({ title: "Signature required", message: "Please add your signature before submitting.", kind: "warning" });
                return;
              }
              setActionLoading(true);
              try {
                // Save images/completionDate to the form first
                const saveResponse = await fetch(
                  `/api/admin/onboard-requests/${form.id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      imageUrls: coordImageUrls,
                      completionDate: coordCompletionDate || undefined,
                    }),
                  }
                );
                if (!saveResponse.ok) {
                  const data = await saveResponse.json().catch(() => ({}));
                  throw new Error(data.error ?? "Save failed");
                }

                // Then submit to manager
                const submitResponse = await fetch(
                  `/api/admin/onboard-requests/${form.id}/submit`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      comments: coordComments || undefined,
                      signatureUrl: coordSignatureUrl || undefined,
                      signatureDate:
                        coordCompletionDate || new Date().toISOString(),
                    }),
                  }
                );
                if (!submitResponse.ok) {
                  const data = await submitResponse.json().catch(() => ({}));
                  throw new Error(data.error ?? "Submit failed");
                }

                notify({
                  title: "Submitted",
                  message:
                    "Onboard request submitted to manager for review.",
                  kind: "success",
                });
                fetchForm();
              } catch (err) {
                notify({
                  title: "Error",
                  message:
                    err instanceof Error ? err.message : "Action failed",
                  kind: "error",
                });
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
          >
            {actionLoading ? "Submitting..." : "Submit to Manager"}
          </button>
        </section>
      )}

      {/* Approval Timeline */}
      {form.approvals.length > 0 && (
        <section className="card-flat p-4 space-y-3">
          <h3 className="text-sm font-semibold">Approval Timeline</h3>
          <div className="approval-timeline">
            {form.approvals.map((approval) => (
              <div key={approval.id} className="approval-step">
                <div
                  className={`approval-step-dot ${
                    approval.action === "DENIED"
                      ? "approval-step-dot-denied"
                      : approval.action === "APPROVED"
                      ? "approval-step-dot-approved"
                      : "approval-step-dot-submitted"
                  }`}
                >
                  {approval.action === "DENIED" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="approval-step-header">
                  <span className="font-medium text-sm">{approval.admin.name}</span>
                  <span className={`badge ${ROLE_BADGE_CLASSES[approval.role] ?? "badge-muted"} text-xs`}>
                    {ROLE_LABELS[approval.role] ?? approval.role}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      approval.action === "DENIED"
                        ? "text-red-600"
                        : approval.action === "APPROVED"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {approval.action}
                  </span>
                </div>
                <p className="approval-step-meta">{formatDate(approval.createdAt)}</p>
                {approval.governanceScore !== null && (
                  <p className="text-xs mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Governance Score: </span>
                    <span className="font-semibold">{approval.governanceScore}%</span>
                  </p>
                )}
                {approval.comments && (
                  <div className="approval-step-comments">{approval.comments}</div>
                )}
                {approval.signatureUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signature</p>
                    <div className="approval-step-signature">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={approval.signatureUrl} alt="Signature" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Panel */}
      {canAct && (
        <section className="card-flat p-4 space-y-4 border-2 border-[var(--momo-blue)]">
          <h3 className="text-sm font-semibold">Your Action</h3>

          <div className="space-y-1">
            <label className="label">Comments</label>
            <textarea
              className="input"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add your comments..."
            />
          </div>

          {isGovernanceStage && (
            <div className="space-y-1">
              <label className="label">Governance Score (1-100%)</label>
              <input
                className="input"
                type="number"
                min={1}
                max={100}
                value={governanceScore}
                onChange={(e) => setGovernanceScore(e.target.value)}
                placeholder="Enter score percentage"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={signatureDate}
              onChange={(e) => setSignatureDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="label">Signature</label>
            <SignaturePad
              existingSignatureUrl={signatureUrl || undefined}
              onSignatureReady={setSignatureUrl}
              onClear={() => setSignatureUrl("")}
              onError={(msg) => notify({ title: "Signature error", message: msg, kind: "error" })}
              disabled={actionLoading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={() => setConfirmAction("approve")}
              disabled={actionLoading}
            >
              {isGovernanceStage ? "Approve" : "Approve & Forward"}
            </button>
            <button
              type="button"
              className="btn btn-danger-light text-sm"
              onClick={() => setConfirmAction("deny")}
              disabled={actionLoading}
            >
              Deny
            </button>
          </div>
        </section>
      )}

      <ConfirmModal
        open={confirmAction === "approve"}
        title={isGovernanceStage ? "Approve Onboard Request" : "Approve & Forward"}
        description={
          isGovernanceStage
            ? `Approve onboard request for "${form.businessName}" with a governance score of ${governanceScore || "?"}%?`
            : `Approve and forward onboard request for "${form.businessName}" to the next stage?`
        }
        confirmLabel={isGovernanceStage ? "Approve" : "Approve & Forward"}
        confirmVariant="primary"
        onConfirm={handleApprove}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction === "deny"}
        title="Deny Onboard Request"
        description={`Deny onboard request for "${form.businessName}"? The coordinator will be notified.`}
        confirmLabel="Deny"
        confirmVariant="danger"
        onConfirm={handleDeny}
        onCancel={() => setConfirmAction(null)}
      />
      </div>
    </main>
  );
}
