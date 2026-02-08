"use client";

import { signOut } from "next-auth/react";

import { storeToast } from "@/components/post-auth-toast";

export default function SuspendedOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="glass-panel w-full max-w-md p-8 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-7 w-7 text-red-600 dark:text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Account Suspended</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your partner account has been suspended by an administrator. Please
            contact support if you believe this is an error.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-danger-light w-full"
          onClick={() => {
            storeToast({
              title: "Signed out",
              message: "You have been signed out.",
              kind: "info",
            });
            signOut({ callbackUrl: "/partner/login" });
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
