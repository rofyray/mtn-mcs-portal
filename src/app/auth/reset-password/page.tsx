"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { notify } = useToast();
  useAutoDismiss(error, setError);

  useEffect(() => {
    const root = document.documentElement;
    const hadRootClass = root.classList.contains("auth-no-scroll");
    const hadBodyClass = document.body.classList.contains("auth-no-scroll");
    document.body.classList.add("auth-no-scroll");
    root.classList.add("auth-no-scroll");
    return () => {
      if (!hadBodyClass) {
        document.body.classList.remove("auth-no-scroll");
      }
      if (!hadRootClass) {
        root.classList.remove("auth-no-scroll");
      }
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!email || !token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        notify({
          title: "Password reset",
          message: "Your password has been reset successfully.",
          kind: "success",
        });
      } else {
        setError(data.error || "Failed to reset password");
        notify({
          title: "Error",
          message: data.error || "Failed to reset password",
          kind: "error",
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
      notify({
        title: "Error",
        message: "Something went wrong. Please try again.",
        kind: "error",
      });
    }

    setLoading(false);
  }

  if (!email || !token) {
    return (
      <main className="min-h-0">
        <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none">
          <div className="w-full max-w-md space-y-6 glass-panel p-6 page-animate pointer-events-auto">
            <h1 className="text-2xl font-semibold">Invalid Reset Link</h1>
            <p className="text-muted">
              This password reset link is invalid or has expired.
            </p>
            <a
              href="/auth/forgot-password"
              className="btn btn-primary w-full block text-center"
            >
              Request New Link
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-0">
      <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-md space-y-6 glass-panel p-6 page-animate pointer-events-auto">
          <h1 className="text-2xl font-semibold">Reset Password</h1>

          {success ? (
            <div className="space-y-4">
              <p className="text-muted">
                Your password has been reset successfully. You can now sign in
                with your new password.
              </p>
              <a
                href="/partner/login"
                className="btn btn-primary w-full block text-center"
              >
                Sign In
              </a>
            </div>
          ) : (
            <>
              <p className="text-muted">Enter your new password below.</p>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="label">New Password</label>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <p className="text-xs text-muted">Minimum 8 characters</p>
                </div>
                <div className="space-y-1">
                  <label className="label">Confirm Password</label>
                  <input
                    className="input"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                {error ? (
                  <p className="form-message form-message-error">{error}</p>
                ) : null}
                <button
                  className="btn btn-primary w-full"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
              <p className="text-sm">
                Remember your password?{" "}
                <a href="/partner/login" className="link-accent">
                  Sign in
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-0">
          <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none">
            <div className="w-full max-w-md space-y-6 glass-panel p-6 page-animate pointer-events-auto">
              <h1 className="text-2xl font-semibold">Reset Password</h1>
              <p className="text-muted">Loading...</p>
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
