"use client";

import { memo, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { ghanaLocations, GREATER_ACCRA_SBUS } from "@/lib/ghana-locations";

const AdminRegionEditModal = dynamic(() => import("@/components/admin-region-edit-modal"));
const AdminCreateModal = dynamic(() => import("@/components/admin-create-modal"));
const ConfirmModal = dynamic(() => import("@/components/confirm-modal"));

type AdminData = {
  id: string;
  name: string;
  email: string;
  role: "FULL" | "MANAGER" | "COORDINATOR" | "SENIOR_MANAGER" | "GOVERNANCE";
  enabled: boolean;
  regionCodes: string[];
  sbuAssignments?: Record<string, string>;
};

const SBU_LABELS: Record<string, string> = Object.fromEntries(
  GREATER_ACCRA_SBUS.map((s) => [s.code, s.name])
);

const ROLE_LABELS: Record<string, string> = {
  FULL: "Full Access",
  MANAGER: "Manager",
  COORDINATOR: "Coordinator",
  SENIOR_MANAGER: "Senior Manager",
  GOVERNANCE: "Governance",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  FULL: "badge-warning",
  MANAGER: "badge-primary",
  COORDINATOR: "badge-info",
  SENIOR_MANAGER: "badge-success",
  GOVERNANCE: "badge-warning",
};

const ROLE_ORDER: AdminData["role"][] = ["FULL", "MANAGER", "SENIOR_MANAGER", "GOVERNANCE", "COORDINATOR"];

const SECTION_TITLES: Record<string, string> = {
  FULL: "Platform Admins",
  MANAGER: "Managers",
  SENIOR_MANAGER: "Senior Managers",
  GOVERNANCE: "Governance",
  COORDINATOR: "Regional Coordinators",
};

const MAX_VISIBLE_PILLS = 3;

const regionOptions = Object.entries(ghanaLocations)
  .map(([code, region]) => ({
    value: code,
    label: region.name,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export default function AdminManagementSection() {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    adminId: string;
    adminName: string;
    action: "enable" | "disable";
  }>({
    open: false,
    adminId: "",
    adminName: "",
    action: "disable",
  });

  const [editingAdmin, setEditingAdmin] = useState<AdminData | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set()
  );

  const toggleSection = useCallback((role: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/management");
      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }
      const data = await response.json();
      setAdmins(data.admins);
      setError(null);
    } catch {
      setError("Failed to load admin list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleToggleStatus = useCallback((admin: AdminData) => {
    setConfirmModal({
      open: true,
      adminId: admin.id,
      adminName: admin.name,
      action: admin.enabled ? "disable" : "enable",
    });
  }, []);

  const handleEditRegions = useCallback((admin: AdminData) => {
    setEditingAdmin(admin);
  }, []);

  async function confirmToggle() {
    const { adminId, action } = confirmModal;
    setActionLoading(adminId);
    setConfirmModal((prev) => ({ ...prev, open: false }));

    try {
      const response = await fetch(`/api/admin/management/${adminId}/toggle`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      const data = await response.json();
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === adminId ? { ...admin, enabled: data.enabled } : admin
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} admin`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegionChange(adminId: string, regionCodes: string[], sbuAssignments?: Record<string, string>) {
    setActionLoading(adminId);

    try {
      const response = await fetch(`/api/admin/management/${adminId}/regions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionCodes, sbuAssignments }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update regions");
      }

      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === adminId ? { ...admin, regionCodes, sbuAssignments } : admin
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update regions");
      // Refetch to reset to server state
      fetchAdmins();
      throw err; // Re-throw so modal can handle it
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateAdmin(data: {
    name: string;
    email: string;
    role: string;
    regionCodes: string[];
    sbuAssignments: Record<string, string>;
  }) {
    const response = await fetch("/api/admin/management", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error || "Failed to create admin");
    }

    const { admin } = await response.json();
    setAdmins((prev) => [...prev, admin as AdminData]);
  }

  // Group admins by role
  const adminsByRole = ROLE_ORDER.reduce(
    (acc, role) => {
      acc[role] = admins.filter((admin) => admin.role === role);
      return acc;
    },
    {} as Record<AdminData["role"], AdminData[]>
  );

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">Admin Management</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage admin accounts, enable/disable access, and assign regions.
        </p>
      </div>
      <button className="btn btn-primary shrink-0" onClick={() => setCreateModalOpen(true)}>
        + Add Admin
      </button>
    </div>
  );

  if (loading) {
    return (
      <>
        {header}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Loading admins...</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <div className="space-y-2 mt-4">
          <p className="text-sm text-red-600">{error}</p>
          <button className="btn btn-secondary" onClick={fetchAdmins}>
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {header}

        {admins.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No admins found.</p>
        ) : (
          ROLE_ORDER.map((role) => {
            const roleAdmins = adminsByRole[role];
            if (roleAdmins.length === 0) return null;

            return (
              <div key={role} className="space-y-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                  onClick={() => toggleSection(role)}
                >
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {SECTION_TITLES[role]} ({roleAdmins.length})
                  </h3>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedSections.has(role) ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {expandedSections.has(role) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roleAdmins.map((admin) => (
                      <AdminCard
                        key={admin.id}
                        admin={admin}
                        actionLoading={actionLoading === admin.id}
                        onToggleStatus={handleToggleStatus}
                        onEditRegions={handleEditRegions}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === "disable" ? "Disable Admin" : "Enable Admin"}
        description={
          confirmModal.action === "disable"
            ? `Are you sure you want to disable ${confirmModal.adminName}? They will no longer be able to log in.`
            : `Are you sure you want to enable ${confirmModal.adminName}? They will be able to log in again.`
        }
        confirmLabel={confirmModal.action === "disable" ? "Disable" : "Enable"}
        confirmVariant={confirmModal.action === "disable" ? "danger" : "primary"}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />

      <AdminRegionEditModal
        open={editingAdmin !== null}
        admin={editingAdmin}
        regionOptions={regionOptions}
        onSave={handleRegionChange}
        onClose={() => setEditingAdmin(null)}
      />

      <AdminCreateModal
        open={createModalOpen}
        regionOptions={regionOptions}
        onSave={handleCreateAdmin}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}

type AdminCardProps = {
  admin: AdminData;
  actionLoading: boolean;
  onToggleStatus: (admin: AdminData) => void;
  onEditRegions: (admin: AdminData) => void;
};

const AdminCard = memo(function AdminCard({
  admin,
  actionLoading,
  onToggleStatus,
  onEditRegions,
}: AdminCardProps) {
  const visibleRegions = admin.regionCodes.slice(0, MAX_VISIBLE_PILLS);
  const hiddenCount = admin.regionCodes.length - MAX_VISIBLE_PILLS;

  return (
    <div className={`card-flat p-4 space-y-3 min-w-0 ${!admin.enabled ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{admin.name}</span>
            <span className={`badge ${ROLE_BADGE_CLASSES[admin.role]}`}>
              {ROLE_LABELS[admin.role]}
            </span>
            {!admin.enabled && <span className="badge badge-muted">Disabled</span>}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{admin.email}</p>
        </div>

        <label className="toggle-field shrink-0">
          <input
            type="checkbox"
            checked={admin.enabled}
            disabled={actionLoading}
            onChange={() => onToggleStatus(admin)}
          />
          <span className="toggle-ui" aria-hidden="true" />
          <span className="sr-only">{admin.enabled ? "Disable" : "Enable"} admin</span>
        </label>
      </div>

      {admin.role !== "FULL" && admin.role !== "MANAGER" && admin.role !== "GOVERNANCE" && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="w-full flex items-center gap-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-1.5 -m-1.5 transition-colors"
            onClick={() => onEditRegions(admin)}
            disabled={actionLoading}
          >
            {admin.regionCodes.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {visibleRegions.map((code) => (
                    <span key={code} className="badge badge-muted text-xs">
                      {ghanaLocations[code]?.name ?? code}
                      {admin.sbuAssignments?.[code] && (
                        <span className="ml-1 text-[10px] opacity-75">
                          ({SBU_LABELS[admin.sbuAssignments[code]] ?? admin.sbuAssignments[code]})
                        </span>
                      )}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="badge badge-info text-xs">+{hiddenCount}</span>
                  )}
                </div>
                <span className="text-gray-400 dark:text-gray-500 text-xs shrink-0">Edit</span>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-500 dark:text-gray-400 italic flex-1">
                  No regions assigned
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xs shrink-0">Edit</span>
              </>
            )}
          </button>
        </div>
      )}

      {(admin.role === "FULL" || admin.role === "MANAGER" || admin.role === "GOVERNANCE") && (
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {admin.role === "GOVERNANCE" ? "Governance admins have global access to all regions." : `${admin.role === "FULL" ? "Platform admins" : "Managers"} have global access to all regions.`}
        </p>
      )}
    </div>
  );
});
