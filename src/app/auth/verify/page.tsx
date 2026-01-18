"use client";

import { useEffect, useState } from "react";

export default function VerifyPage() {
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const previous = document.body.style.overflow;
    const root = document.documentElement;
    const hadRootClass = root.classList.contains("auth-no-scroll");
    document.body.style.overflow = "hidden";
    document.body.classList.add("auth-no-scroll");
    root.classList.add("auth-no-scroll");
    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const email = params.get("email");
      const token = params.get("token");

      if (!email || !token) {
        setStatus("Invalid verification link.");
        return;
      }

      const response = await fetch(`/api/auth/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
      if (response.ok) {
        setStatus("Your account is verified. You can now sign in.");
      } else {
        setStatus("Verification failed or link expired.");
      }
    }

    verify();
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove("auth-no-scroll");
      if (!hadRootClass) {
        root.classList.remove("auth-no-scroll");
      }
    };
  }, []);

  return (
    <main className="min-h-0">
      <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-md space-y-4 text-center glass-panel p-6 page-animate pointer-events-auto">
          <h1 className="text-2xl font-semibold">Email Verification</h1>
          <p>{status}</p>
          <a href="/partner/login" className="btn btn-primary w-full">Log In</a>
        </div>
      </div>
    </main>
  );
}
