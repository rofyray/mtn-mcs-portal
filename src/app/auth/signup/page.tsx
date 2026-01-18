"use client";

import { useEffect, useState } from "react";

import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { useToast } from "@/components/toast";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      notify({ title: "Signup failed", message: "Passwords do not match.", kind: "error" });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to create account.");
      notify({
        title: "Signup failed",
        message: data.error ?? "Unable to create account.",
        kind: "error",
      });
      setLoading(false);
      return;
    }

    setStatus("Account created. Check your email to verify your account.");
    notify({
      title: "Account created",
      message: "Check your email to verify your account.",
      kind: "success",
    });
    setLoading(false);
  }

  return (
    <main className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 glass-panel p-6 page-animate">
        <h1 className="text-2xl font-semibold">Partner Signup</h1>
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
          <div className="space-y-1">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="form-message form-message-error">{error}</p> : null}
          {status ? <p className="form-message form-message-success">{status}</p> : null}
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="text-sm">
          Already have an account? <a href="/partner/login" className="link-accent">Sign in</a>
        </p>
      </div>
    </main>
  );
}
