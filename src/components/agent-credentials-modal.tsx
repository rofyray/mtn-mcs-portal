"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AgentCredentialsModalProps = {
  open: boolean;
  agentId: string;
  agentName: string;
  existingCpAppNumber?: string | null;
  existingAgentUsername?: string | null;
  existingMinervaReferralCode?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function AgentCredentialsModal({
  open,
  agentId,
  agentName,
  existingCpAppNumber,
  existingAgentUsername,
  existingMinervaReferralCode,
  onClose,
  onSaved,
}: AgentCredentialsModalProps) {
  const [cpAppNumber, setCpAppNumber] = useState("");
  const [agentUsername, setAgentUsername] = useState("");
  const [minervaReferralCode, setMinervaReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCpAppNumber("");
      setAgentUsername("");
      setMinervaReferralCode("");
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

  const hasCpApp = Boolean(existingCpAppNumber);
  const hasUsername = Boolean(existingAgentUsername);
  const hasMinerva = Boolean(existingMinervaReferralCode);

  const hasNewValues =
    (!hasCpApp && cpAppNumber.trim().length > 0) ||
    (!hasUsername && agentUsername.trim().length > 0) ||
    (!hasMinerva && minervaReferralCode.trim().length > 0);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const payload: Record<string, string> = {};
    if (!hasCpApp && cpAppNumber.trim()) payload.cpAppNumber = cpAppNumber.trim();
    if (!hasUsername && agentUsername.trim()) payload.agentUsername = agentUsername.trim();
    if (!hasMinerva && minervaReferralCode.trim())
      payload.minervaReferralCode = minervaReferralCode.trim();

    try {
      const response = await fetch(`/api/partner/agents/${agentId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Unable to save credentials.");
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
      aria-label="Agent Credentials"
      onClick={() => { if (!loading) onClose(); }}
    >
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold">Agent Credentials</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agentName}</p>
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
            <label className="label">CP App Number</label>
            {hasCpApp ? (
              <input className="input bg-gray-100 dark:bg-gray-800" value={existingCpAppNumber ?? ""} disabled />
            ) : (
              <input
                className="input"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter CP app number"
                value={cpAppNumber}
                onChange={(e) => setCpAppNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={loading}
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="label">Agent Username</label>
            {hasUsername ? (
              <input className="input bg-gray-100 dark:bg-gray-800" value={existingAgentUsername ?? ""} disabled />
            ) : (
              <input
                className="input"
                placeholder="Enter agent username"
                value={agentUsername}
                onChange={(e) => setAgentUsername(e.target.value)}
                disabled={loading}
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="label">Minerva Referral Code</label>
            {hasMinerva ? (
              <input className="input bg-gray-100 dark:bg-gray-800" value={existingMinervaReferralCode ?? ""} disabled />
            ) : (
              <input
                className="input"
                placeholder="Enter referral code"
                value={minervaReferralCode}
                onChange={(e) => setMinervaReferralCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
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
