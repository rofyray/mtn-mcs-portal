"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { useAdminRole } from "@/contexts/admin-context";

function resolveHomeHref(pathname: string, adminRole?: string) {
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return "/admin/login";
    }
    if (adminRole === "SENIOR_MANAGER") return "/admin/map-reports";
    if (adminRole === "GOVERNANCE") return "/admin/onboard-requests";
    return "/admin";
  }
  if (pathname.startsWith("/partner")) {
    if (pathname === "/partner/login") {
      return "/partner/login";
    }
    return "/partner/dashboard";
  }
  if (pathname.startsWith("/onboarding")) {
    return "/partner/dashboard";
  }
  return "/partner/login";
}

export default function AppLogoLink() {
  const pathname = usePathname();
  const { status } = useSession();
  const { role: adminRole } = useAdminRole();
  const homeHref = resolveHomeHref(pathname, adminRole ?? undefined);
  const isPartnerRoute = pathname.startsWith("/partner") || pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin");
  const showCompactLogo =
    (isPartnerRoute && status === "authenticated" && pathname !== "/partner/login") ||
    (isAdminRoute && pathname !== "/admin/login");

  return (
    <Link
      className={`logo-wrap ${showCompactLogo ? "logo-compact" : ""}`}
      href={homeHref}
      aria-label="MTN Community Shop home"
    >
      <Image
        src="/brand/mtnlogoblack.png"
        alt="MTN logo"
        width={120}
        height={60}
        className="logo-image"
      />
      <div className="logo-text">
        <p className="logo-title">MTN Community Shop</p>
        <p className="logo-subtitle">Partner Management</p>
      </div>
    </Link>
  );
}
