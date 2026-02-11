"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type BusinessDeviceModalProps = {
  open: boolean;
  businessId: string;
  businessName: string;
  existingApn?: string | null;
  existingMifiImei?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function BusinessDeviceModal({
  open,
  businessId,
  businessName,
  existingApn,
  existingMifiImei,
  onClose,
  onSaved,
}: BusinessDeviceModalProps) {
  const [apn, setApn] = useState("");
  const [mifiImei, setMifiImei] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setApn("");
      setMifiImei("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, loading, onClose]);

  const hasApn = Boolean(existingApn);
  const hasImei = Boolean(existingMifiImei);

  const hasNewValues =
    (!hasApn && apn.trim().length > 0) ||
    (!hasImei && mifiImei.trim().length > 0);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const payload: Record<string, string> = {};
    if (!hasApn && apn.trim()) payload.apn = apn.trim();
    if (!hasImei && mifiImei.trim()) payload.mifiImei = mifiImei.trim();

    try {
      const response = await fetch(`/api/partner/businesses/${businessId}/device-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Unable to save device details.");
        setLoading(false);
        return;
      }

      onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Device Details"
      onClick={() => { if (!loading) onClose(); }}
    >
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold">Device Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{businessName}</p>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body space-y-4">
          <div className="space-y-1">
            <label className="label">APN</label>
            {hasApn ? (
              <input className="input bg-gray-100 dark:bg-gray-800" value={existingApn ?? ""} disabled />
            ) : (
              <input
                className="input"
                inputMode="numeric"
                placeholder="Enter APN"
                value={apn}
                onChange={(e) => setApn(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="label">MiFi/Router IMEI</label>
            {hasImei ? (
              <input className="input bg-gray-100 dark:bg-gray-800" value={existingMifiImei ?? ""} disabled />
            ) : (
              <input
                className="input"
                inputMode="numeric"
                maxLength={15}
                placeholder="Enter IMEI (max 15 digits)"
                value={mifiImei}
                onChange={(e) => setMifiImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
                disabled={loading}
              />
            )}
          </div>
        </div>
        <div className="modal-footer">
          {error ? <p className="form-message form-message-error mr-auto">{error}</p> : null}
          <button className="btn btn-secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={loading || !hasNewValues}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
