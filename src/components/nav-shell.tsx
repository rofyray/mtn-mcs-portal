"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, memo, useCallback } from "react";

import { useAdmin } from "@/contexts/admin-context";

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const iconProps = {
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const partnerLinks: NavLink[] = [
  {
    href: "/partner/dashboard",
    label: "Dashboard",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 10h7v11h-7zM3 14h7v7H3z" />
      </svg>
    ),
  },
  {
    href: "/partner/agents",
    label: "Agents",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/partner/businesses",
    label: "Locations",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M3 11h18" />
        <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
        <path d="M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9" />
        <path d="M9 22v-6h6v6" />
      </svg>
    ),
  },
  {
    href: "/partner/requests",
    label: "Requests",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M9 3h6l3 3v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M9 12h6M9 16h6M9 8h2" />
      </svg>
    ),
  },
  {
    href: "/partner/forms",
    label: "Forms",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6M9 9h2" />
      </svg>
    ),
  },
];

type AdminNavLink = NavLink & { fullOnly?: boolean; seniorManagerOnly?: boolean };

const adminLinks: AdminNavLink[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 10h7v11h-7zM3 14h7v7H3z" />
      </svg>
    ),
  },
  {
    href: "/admin/partners",
    label: "Partners",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8" cy="7" r="4" />
        <path d="M17 11h6M20 8v6" />
      </svg>
    ),
  },
  {
    href: "/admin/agents",
    label: "Agents",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/businesses",
    label: "Locations",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M3 11h18" />
        <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
        <path d="M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9" />
        <path d="M9 22v-6h6v6" />
      </svg>
    ),
  },
  {
    href: "/admin/forms",
    label: "Forms",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6M9 9h2" />
      </svg>
    ),
  },
  {
    href: "/admin/onboard-requests",
    label: "Onboard Requests",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M9 2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
        <path d="M9 14H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" />
        <path d="M14 4h7M14 9h5M14 16h7M14 21h5" />
        <path d="M21 12l-3 3-2-2" />
      </svg>
    ),
  },
  {
    href: "/admin/feedback",
    label: "Feedback",
    fullOnly: true,
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 8h8M8 12h6" />
      </svg>
    ),
  },
  {
    href: "/admin/audit",
    label: "Audit Logs",
    fullOnly: true,
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <path d="M3 3h18v6H3zM7 21h10" />
        <path d="M12 9v12" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    fullOnly: true,
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .33 1.86l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.7 1.7 0 0 0-1.86-.33 1.7 1.7 0 0 0-1 1.53V21a2 2 0 1 1-4 0v-.07a1.7 1.7 0 0 0-1-1.53 1.7 1.7 0 0 0-1.86.33l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.7 1.7 0 0 0 .33-1.86 1.7 1.7 0 0 0-1.53-1H3a2 2 0 1 1 0-4h.07a1.7 1.7 0 0 0 1.53-1 1.7 1.7 0 0 0-.33-1.86l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.7 1.7 0 0 0 1.86.33 1.7 1.7 0 0 0 1-1.53V3a2 2 0 1 1 4 0v.07a1.7 1.7 0 0 0 1 1.53 1.7 1.7 0 0 0 1.86-.33l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.7 1.7 0 0 0-.33 1.86 1.7 1.7 0 0 0 1.53 1H21a2 2 0 1 1 0 4h-.07a1.7 1.7 0 0 0-1.53 1Z" />
      </svg>
    ),
  },
];

const navStorageKey = "nav-collapsed";

type NavLinksProps = {
  links: NavLink[];
  pathname: string;
  onLinkClick?: () => void;
  showTooltip?: boolean;
};

const NavLinks = memo(function NavLinks({ links, pathname, onLinkClick, showTooltip = true }: NavLinksProps) {
  return (
    <nav className="nav-links">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${active ? "nav-link-active" : ""}`}
            aria-label={link.label}
            title={link.label}
            onClick={onLinkClick}
          >
            <span className="nav-icon">{link.icon}</span>
            <span className="nav-label">{link.label}</span>
            {showTooltip && <span className="nav-tooltip">{link.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
});

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { admin, isLoading } = useAdmin();
  const adminRole = admin?.role ?? null;
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const hideNav =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboard-request") ||
    pathname === "/admin/login" ||
    pathname === "/partner/login" ||
    pathname === "/onboarding" ||
    pathname === "/admin/map-reports" ||
    adminRole === "GOVERNANCE_CHECK" ||
    adminRole === "SENIOR_MANAGER" ||
    (isAdminRoute && isLoading);

  const collapsed = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") {
        return () => {};
      }
      window.addEventListener("storage", callback);
      window.addEventListener("nav-collapsed", callback);
      return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener("nav-collapsed", callback);
      };
    },
    () => window.localStorage.getItem(navStorageKey) === "true",
    () => false
  );

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem(navStorageKey, String(next));
    window.dispatchEvent(new Event("nav-collapsed"));
  }

  useEffect(() => {
    function handleToggle() {
      if (!window.matchMedia("(max-width: 900px)").matches) {
        return;
      }
      setMobileOpen((prev) => !prev);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("toggle-mobile-nav", handleToggle);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("toggle-mobile-nav", handleToggle);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    function handleChange(event: MediaQueryListEvent) {
      if (!event.matches) {
        setMobileOpen(false);
      }
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  const isAdmin = pathname.startsWith("/admin");
  const links = useMemo(() => {
    if (!isAdmin) return partnerLinks;
    const isFullAccess = adminRole === "FULL";
    const isManager = adminRole === "MANAGER";
    return adminLinks.filter((link) => {
      if (link.fullOnly && !isFullAccess && !isManager) return false;
      return true;
    });
  }, [adminRole, isAdmin]);

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className={`nav-shell ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <aside className="nav-panel">
        <div className="nav-panel-header">
          <p className="nav-title">{isAdmin ? "Admin Menu" : "Partner Menu"}</p>
        </div>
        <div className="nav-panel-divider" />
        <NavLinks links={links} pathname={pathname} showTooltip />
        <div className="nav-panel-footer">
          <div className="nav-panel-divider" />
          <button
            className="nav-collapse"
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
              <path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
            </svg>
            <span className="nav-collapse-label">Collapse</span>
          </button>
        </div>
      </aside>
      {mobileOpen ? (
        <div className="nav-overlay" onClick={closeMobileNav} role="presentation">
          <aside
            className="nav-panel nav-panel-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="nav-panel-header">
              <p className="nav-title">{isAdmin ? "Admin Menu" : "Partner Menu"}</p>
              <button
                className="nav-collapse"
                type="button"
                onClick={closeMobileNav}
                aria-label="Close menu"
                title="Close menu"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" {...iconProps}>
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div className="nav-panel-divider" />
            <NavLinks links={links} pathname={pathname} onLinkClick={closeMobileNav} showTooltip={false} />
          </aside>
        </div>
      ) : null}
      <section className="nav-content">{children}</section>
    </div>
  );
}
