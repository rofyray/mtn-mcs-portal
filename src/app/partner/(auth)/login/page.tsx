"use client";

import { getSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { storeToast } from "@/components/post-auth-toast";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  useAutoDismiss(error, setError);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      const session = await getSession();
      if (!isMounted) return;
      if (session?.user?.email) {
        window.location.replace("/partner/dashboard");
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials or unverified account.");
      notify({
        title: "Login failed",
        message: "Invalid credentials or unverified account.",
        kind: "error",
      });
    } else {
      storeToast({
        title: "Welcome back",
        message: "You are signed in.",
        kind: "success",
      });
      window.location.href = "/partner/dashboard";
    }

    setLoading(false);
  }

  return (
    <main className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 glass-panel p-6 page-animate">
        <h1 className="text-2xl font-semibold">Partner Login</h1>
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
          {error ? <p className="form-message form-message-error">{error}</p> : null}
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-sm">
          Don&apos;t have an account? <a href="/auth/signup" className="link-accent">Sign up</a>
        </p>
      </div>
    </main>
  );
}
