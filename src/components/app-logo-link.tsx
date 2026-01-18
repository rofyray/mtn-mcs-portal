"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function resolveHomeHref(pathname: string) {
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return "/admin/login";
    }
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
  const homeHref = resolveHomeHref(pathname);

  return (
    <Link className="logo-wrap" href={homeHref} aria-label="MTN Community Shop home">
      <Image
        src="/brand/mtnlogoblack.png"
        alt="MTN logo"
        width={120}
        height={60}
        className="logo-image"
      />
      <div>
        <p className="logo-title">MTN Community Shop</p>
        <p className="logo-subtitle">Partner Management</p>
      </div>
    </Link>
  );
}
