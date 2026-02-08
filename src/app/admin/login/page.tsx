"use client";

import { useEffect, useMemo, useState } from "react";

import { storeToast } from "@/components/post-auth-toast";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";

type AdminOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminLoginPage() {
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"select" | "verify">("select");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);
  const coordinators = useMemo(
    () => admins.filter((admin) => admin.role === "COORDINATOR"),
    [admins]
  );
  const fullAccessAdmins = useMemo(
    () => admins.filter((admin) => admin.role === "FULL"),
    [admins]
  );
  const seniorManagers = useMemo(
    () => admins.filter((admin) => admin.role === "SENIOR_MANAGER"),
    [admins]
  );
  const managers = useMemo(
    () => admins.filter((admin) => admin.role === "MANAGER"),
    [admins]
  );
  const governanceCheckAdmins = useMemo(
    () => admins.filter((admin) => admin.role === "GOVERNANCE"),
    [admins]
  );

  useEffect(() => {
    const root = document.documentElement;
    const hadRootClass = root.classList.contains("auth-no-scroll");
    const hadBodyClass = document.body.classList.contains("auth-no-scroll");
    document.body.classList.add("auth-no-scroll");
    root.classList.add("auth-no-scroll");
    async function loadAdmins() {
      const response = await fetch("/api/admin/list");
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setAdmins(data.admins ?? []);
    }

    loadAdmins();
    return () => {
      if (!hadBodyClass) {
        document.body.classList.remove("auth-no-scroll");
      }
      if (!hadRootClass) {
        root.classList.remove("auth-no-scroll");
      }
    };
  }, []);

  async function requestOtp() {
    if (!selectedEmail) {
      setError("Select an admin to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    const response = await fetch("/api/admin/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: selectedEmail }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to send OTP.");
      notify({
        title: "OTP failed",
        message: data.error ?? "Unable to send OTP.",
        kind: "error",
      });
    } else {
      setStage("verify");
      setStatus("OTP sent. Check your email.");
      notify({
        title: "OTP sent",
        message: "Check your email for the code.",
        kind: "success",
      });
    }

    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    setStatus(null);

    const response = await fetch("/api/admin/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: selectedEmail, code: otp }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to verify OTP.");
      notify({
        title: "Verification failed",
        message: data.error ?? "Unable to verify OTP.",
        kind: "error",
      });
    } else {
      const data = await response.json().catch(() => ({}));
      setStatus("Verified. Redirecting...");
      storeToast({
        title: "Welcome back",
        message: "Admin access granted.",
        kind: "success",
      });
      function getAdminHome(role: string) {
        if (role === "SENIOR_MANAGER") return "/admin/map-reports";
        if (role === "GOVERNANCE") return "/admin/onboard-requests";
        return "/admin";
      }
      window.location.href = getAdminHome(data.role ?? "");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-0">
      <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-md space-y-6 glass-panel p-6 page-animate pointer-events-auto">
          <div>
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Select your name to receive an OTP.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="label">Admin</label>
            <select
              className="input"
              value={selectedEmail}
              onChange={(event) => setSelectedEmail(event.target.value)}
              disabled={stage === "verify"}
            >
              <option value="">Select admin</option>
              {coordinators.length > 0 ? (
                <optgroup label="Regional Coordinators">
                  {coordinators.map((admin) => (
                    <option key={admin.id} value={admin.email}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {fullAccessAdmins.length > 0 ? (
                <optgroup label="Platform Admins">
                  {fullAccessAdmins.map((admin) => (
                    <option key={admin.id} value={admin.email}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {managers.length > 0 ? (
                <optgroup label="Managers">
                  {managers.map((admin) => (
                    <option key={admin.id} value={admin.email}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {seniorManagers.length > 0 ? (
                <optgroup label="Senior Managers">
                  {seniorManagers.map((admin) => (
                    <option key={admin.id} value={admin.email}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {governanceCheckAdmins.length > 0 ? (
                <optgroup label="Governance">
                  {governanceCheckAdmins.map((admin) => (
                    <option key={admin.id} value={admin.email}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </div>

          {stage === "verify" ? (
            <div className="space-y-1">
              <label className="label">OTP Code</label>
              <input
                className="input"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter 6-digit code"
              />
            </div>
          ) : null}
        </div>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {status ? <p className="form-message form-message-success">{status}</p> : null}

        <div className="flex gap-3">
          {stage === "verify" ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={verifyOtp}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              onClick={requestOtp}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          )}
          {stage === "verify" ? (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setStage("select");
                setOtp("");
              }}
            >
              Change admin
            </button>
          ) : null}
        </div>
      </div>
      </div>
    </main>
  );
}
