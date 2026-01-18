"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { storeToast } from "@/components/post-auth-toast";
import ThemeToggle from "@/components/theme-toggle";

export default function HeaderActions() {
  const pathname = usePathname();
  const { status } = useSession();
  const isPartnerRoute = pathname.startsWith("/partner") || pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin");
  const showMobileNavToggle =
    (isPartnerRoute &&
      status === "authenticated" &&
      pathname !== "/partner/login" &&
      pathname !== "/onboarding") ||
    (isAdminRoute && pathname !== "/admin/login");
  const showPartnerNotifications =
    status === "authenticated" && isPartnerRoute && pathname !== "/partner/login";
  const showAdminNotifications = isAdminRoute && pathname !== "/admin/login";
  const showAdminLogout = isAdminRoute && pathname !== "/admin/login";
  const showLogout = status === "authenticated" && isPartnerRoute && pathname !== "/partner/login";

  return (
    <div className="header-actions">
      {showMobileNavToggle ? (
        <button
          type="button"
          className="icon-button mobile-nav-toggle"
          aria-label="Open menu"
          title="Open menu"
          onClick={() => {
            window.dispatchEvent(new Event("toggle-mobile-nav"));
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      ) : null}
      {showPartnerNotifications ? (
        <Link
          href="/partner/notifications"
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </Link>
      ) : null}
      {showAdminNotifications ? (
        <Link
          href="/admin/notifications"
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </Link>
      ) : null}
      <ThemeToggle />
      {showAdminLogout ? (
        <button
          type="button"
          className="icon-button"
          aria-label="Log out"
          title="Log out"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            storeToast({
              title: "Signed out",
              message: "You have been logged out.",
              kind: "info",
            });
            window.location.href = "/admin/login";
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        </button>
      ) : null}
      {showLogout ? (
        <button
          type="button"
          className="icon-button"
          aria-label="Log out"
          title="Log out"
          onClick={() => {
            storeToast({
              title: "Signed out",
              message: "You have been logged out.",
              kind: "info",
            });
            signOut({ callbackUrl: "/partner/login" });
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
