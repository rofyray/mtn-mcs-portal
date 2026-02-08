"use client";

import { memo, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { useDebounce } from "@/hooks/use-debounce";
import EmptyState from "@/components/empty-state";
import { AdminPartnersEmptyIcon } from "@/components/admin-empty-icons";

const ConfirmModal = dynamic(() => import("@/components/confirm-modal"));

type PartnerData = {
  id: string;
  userId: string;
  status: string;
  suspended: boolean;
  suspendedAt: string | null;
  businessName: string | null;
  partnerFirstName: string | null;
  partnerSurname: string | null;
  phoneNumber: string | null;
  user: { email: string | null };
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-muted",
  SUBMITTED: "badge-info",
  APPROVED: "badge-success",
  DENIED: "badge-danger",
  EXPIRED: "badge-warning",
};

export default function PartnerManagementSection() {
  const [hasPartners, setHasPartners] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Suspend modal
  const [suspendModal, setSuspendModal] = useState<{
    open: boolean;
    partner: PartnerData | null;
  }>({ open: false, partner: null });

  // Delete flow: step 1 (warning) then step 2 (type name)
  const [deleteStep1, setDeleteStep1] = useState<{
    open: boolean;
    partner: PartnerData | null;
  }>({ open: false, partner: null });

  const [deleteStep2, setDeleteStep2] = useState<{
    open: boolean;
    partner: PartnerData | null;
    inputValue: string;
  }>({ open: false, partner: null, inputValue: "" });

  const searchPartners = useCallback(async (q: string) => {
    if (q.length < 2) {
      setPartners([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/partners/search?q=${encodeURIComponent(q)}`
      );
      if (!response.ok) {
        throw new Error("Failed to search partners");
      }
      const data = await response.json();
      setPartners(data.partners);
    } catch {
      setError("Failed to search partners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchPartners(debouncedQuery);
  }, [debouncedQuery, searchPartners]);

  useEffect(() => {
    fetch("/api/admin/partners")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setHasPartners(data.partners.length > 0))
      .catch(() => setHasPartners(false));
  }, []);

  // Suspend / unsuspend
  async function handleSuspendConfirm() {
    const partner = suspendModal.partner;
    if (!partner) return;

    setActionLoading(partner.id);
    setSuspendModal({ open: false, partner: null });

    try {
      const response = await fetch(
        `/api/admin/partners/${partner.id}/suspend`,
        { method: "POST" }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update partner");
      }
      const data = await response.json();
      setPartners((prev) =>
        prev.map((p) =>
          p.id === partner.id
            ? {
                ...p,
                suspended: data.profile.suspended,
                suspendedAt: data.profile.suspendedAt,
              }
            : p
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update partner"
      );
    } finally {
      setActionLoading(null);
    }
  }

  // Delete step 1 → step 2
  function handleDeleteStep1Confirm() {
    const partner = deleteStep1.partner;
    setDeleteStep1({ open: false, partner: null });
    if (partner) {
      setDeleteStep2({ open: true, partner, inputValue: "" });
    }
  }

  // Delete step 2 → actual deletion
  async function handleDeleteStep2Confirm() {
    const partner = deleteStep2.partner;
    if (!partner) return;

    setActionLoading(partner.id);
    setDeleteStep2({ open: false, partner: null, inputValue: "" });

    try {
      const response = await fetch(
        `/api/admin/partners/${partner.id}/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmBusinessName: partner.businessName,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete partner");
      }
      setPartners((prev) => prev.filter((p) => p.id !== partner.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete partner"
      );
    } finally {
      setActionLoading(null);
    }
  }

  if (hasPartners === null) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Partner Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search, suspend, or remove partner accounts.
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (hasPartners === false) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Partner Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search, suspend, or remove partner accounts.
          </p>
        </div>
        <EmptyState
          icon={<AdminPartnersEmptyIcon />}
          title="No partners yet"
          description="Partner accounts will appear here."
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Partner Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search, suspend, or remove partner accounts.
          </p>
        </div>

        <input
          className="input"
          type="text"
          placeholder="Search by name, email, or business name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Searching...
          </p>
        )}

        {!loading && debouncedQuery.length >= 2 && partners.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No partners found.
          </p>
        )}

        {partners.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {partners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                actionLoading={actionLoading === partner.id}
                onSuspend={() =>
                  setSuspendModal({ open: true, partner })
                }
                onDelete={() =>
                  setDeleteStep1({ open: true, partner })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Suspend / Unsuspend confirmation */}
      <ConfirmModal
        open={suspendModal.open}
        title={
          suspendModal.partner?.suspended
            ? "Unsuspend Partner"
            : "Suspend Partner"
        }
        description={
          suspendModal.partner?.suspended
            ? `Are you sure you want to unsuspend ${suspendModal.partner?.businessName ?? "this partner"}? They will regain access to the platform.`
            : `Are you sure you want to suspend ${suspendModal.partner?.businessName ?? "this partner"}? They will be locked out of the platform immediately.`
        }
        confirmLabel={
          suspendModal.partner?.suspended ? "Unsuspend" : "Suspend"
        }
        confirmVariant={
          suspendModal.partner?.suspended ? "primary" : "danger"
        }
        onConfirm={handleSuspendConfirm}
        onCancel={() => setSuspendModal({ open: false, partner: null })}
      />

      {/* Delete step 1: warning */}
      <ConfirmModal
        open={deleteStep1.open}
        title="Delete Partner"
        description={`Are you sure you want to permanently delete ${deleteStep1.partner?.businessName ?? "this partner"}? This action is irreversible. All partner data, agents, businesses, and requests will be permanently removed.`}
        confirmLabel="Continue"
        confirmVariant="danger"
        onConfirm={handleDeleteStep1Confirm}
        onCancel={() => setDeleteStep1({ open: false, partner: null })}
      />

      {/* Delete step 2: type business name */}
      <ConfirmModal
        open={deleteStep2.open}
        title="Confirm Permanent Deletion"
        description={`Type "${deleteStep2.partner?.businessName ?? ""}" to confirm deletion.`}
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
        inputLabel="Business name"
        inputPlaceholder="Type the business name to confirm"
        inputValue={deleteStep2.inputValue}
        inputRequired
        inputMatch={deleteStep2.partner?.businessName ?? ""}
        onInputChange={(value) =>
          setDeleteStep2((prev) => ({ ...prev, inputValue: value }))
        }
        onConfirm={handleDeleteStep2Confirm}
        onCancel={() =>
          setDeleteStep2({ open: false, partner: null, inputValue: "" })
        }
      />
    </>
  );
}

type PartnerCardProps = {
  partner: PartnerData;
  actionLoading: boolean;
  onSuspend: () => void;
  onDelete: () => void;
};

const PartnerCard = memo(function PartnerCard({
  partner,
  actionLoading,
  onSuspend,
  onDelete,
}: PartnerCardProps) {
  const fullName = [partner.partnerFirstName, partner.partnerSurname]
    .filter(Boolean)
    .join(" ") || "Unknown";

  return (
    <div className="card-flat p-4 space-y-3 min-w-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{fullName}</span>
          <span className={`badge ${STATUS_BADGE[partner.status] ?? "badge-muted"}`}>
            {partner.status}
          </span>
          {partner.suspended && (
            <span className="badge badge-danger">Suspended</span>
          )}
        </div>
        {partner.businessName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {partner.businessName}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {partner.user.email ?? "No email"}
        </p>
      </div>

      {partner.status === "APPROVED" && (
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className={`btn ${partner.suspended ? "btn-primary" : "btn-secondary"} text-xs flex-1`}
            disabled={actionLoading}
            onClick={onSuspend}
          >
            {partner.suspended ? "Unsuspend" : "Suspend"}
          </button>
          <button
            type="button"
            className="btn btn-danger-light text-xs flex-1"
            disabled={actionLoading}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
});
