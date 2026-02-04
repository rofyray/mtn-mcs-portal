"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import MultiSelectDropdown from "@/components/multi-select-dropdown";

type MultiSelectOption = {
  value: string;
  label: string;
};

type AdminRegionEditModalProps = {
  open: boolean;
  admin: { id: string; name: string; email: string; regionCodes: string[] } | null;
  regionOptions: MultiSelectOption[];
  onSave: (adminId: string, regionCodes: string[]) => Promise<void>;
  onClose: () => void;
};

export default function AdminRegionEditModal({
  open,
  admin,
  regionOptions,
  onSave,
  onClose,
}: AdminRegionEditModalProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync selected regions when admin changes
  useEffect(() => {
    if (admin) {
      setSelectedRegions(admin.regionCodes);
    }
  }, [admin]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, saving, onClose]);

  async function handleSave() {
    if (!admin) return;

    setSaving(true);
    try {
      await onSave(admin.id, selectedRegions);
      onClose();
    } catch {
      // Error handling is done in parent component
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  if (!open || !admin) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit regions for ${admin.name}`}
      onClick={handleClose}
    >
      <div
        className="modal-panel"
        style={{ maxWidth: "28rem" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold">Edit Regions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {admin.name} &bull; {admin.email}
            </p>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select the regions this admin can manage.
          </p>
          <MultiSelectDropdown
            label="Regions"
            options={regionOptions}
            selectedValues={selectedRegions}
            onChange={setSelectedRegions}
            placeholder="Select regions..."
            emptyLabel="No regions available"
          />
          {selectedRegions.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              This admin has no assigned regions.
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
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
