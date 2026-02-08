"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { GREATER_ACCRA_SBUS, GREATER_ACCRA_REGION_CODE } from "@/lib/ghana-locations";

type MultiSelectOption = {
  value: string;
  label: string;
};

const ROLE_OPTIONS = [
  { value: "COORDINATOR", label: "Coordinator" },
  { value: "MANAGER", label: "Manager" },
  { value: "SENIOR_MANAGER", label: "Senior Manager" },
  { value: "GOVERNANCE", label: "Governance" },
  { value: "FULL", label: "Full Access" },
] as const;

const SCOPED_ROLES = new Set(["COORDINATOR", "SENIOR_MANAGER", "GOVERNANCE"]);

type AdminCreateModalProps = {
  open: boolean;
  regionOptions: MultiSelectOption[];
  onSave: (data: {
    name: string;
    email: string;
    role: string;
    regionCodes: string[];
    sbuAssignments: Record<string, string>;
  }) => Promise<void>;
  onClose: () => void;
};

export default function AdminCreateModal({
  open,
  regionOptions,
  onSave,
  onClose,
}: AdminCreateModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("COORDINATOR");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [sbuCode, setSbuCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setRole("COORDINATOR");
      setSelectedRegions([]);
      setSbuCode("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, saving, onClose]);

  const showRegions = SCOPED_ROLES.has(role);
  const hasGreaterAccra = selectedRegions.includes(GREATER_ACCRA_REGION_CODE);

  // Clear regions when switching to global role
  useEffect(() => {
    if (!showRegions) {
      setSelectedRegions([]);
      setSbuCode("");
    }
  }, [showRegions]);

  // Clear SBU when Greater Accra deselected
  useEffect(() => {
    if (!hasGreaterAccra) {
      setSbuCode("");
    }
  }, [hasGreaterAccra]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const sbuAssignments: Record<string, string> = {};
    if (hasGreaterAccra && sbuCode) {
      sbuAssignments[GREATER_ACCRA_REGION_CODE] = sbuCode;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        regionCodes: selectedRegions,
        sbuAssignments,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Create new admin"
      onClick={handleClose}
    >
      <div
        className="modal-panel"
        style={{ maxWidth: "28rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold">Add Admin</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a new admin account
            </p>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="space-y-1">
              <label className="label" htmlFor="admin-name">Name</label>
              <input
                id="admin-name"
                className="input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="label" htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="label" htmlFor="admin-role">Role</label>
              <select
                id="admin-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={saving}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {showRegions && (
              <>
                <MultiSelectDropdown
                  label="Regions"
                  options={regionOptions}
                  selectedValues={selectedRegions}
                  onChange={setSelectedRegions}
                  placeholder="Select regions..."
                  emptyLabel="No regions available"
                />

                {hasGreaterAccra && (
                  <div className="space-y-1">
                    <label className="label">Greater Accra SBU (optional)</label>
                    <select
                      className="input"
                      value={sbuCode}
                      onChange={(e) => setSbuCode(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">All of Greater Accra</option>
                      {GREATER_ACCRA_SBUS.map((sbu) => (
                        <option key={sbu.code} value={sbu.code}>
                          {sbu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {!showRegions && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This role has global access to all regions.
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
