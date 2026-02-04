"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
        notify({
          title: "Check your email",
          message: "If an account exists, you will receive a reset link.",
          kind: "success",
        });
      } else {
        setError("Something went wrong. Please try again.");
        notify({
          title: "Error",
          message: "Something went wrong. Please try again.",
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

  return (
    <main className="min-h-0">
      <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-md space-y-6 glass-panel p-6 page-animate pointer-events-auto">
          <h1 className="text-2xl font-semibold">Forgot Password</h1>

          {success ? (
            <div className="space-y-4">
              <p className="text-muted">
                If an account exists with this email, you will receive a
                password reset link.
              </p>
              <a href="/partner/login" className="btn btn-primary w-full block text-center">
                Back to Login
              </a>
            </div>
          ) : (
            <>
              <p className="text-muted">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                  {loading ? "Sending..." : "Send Reset Link"}
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
