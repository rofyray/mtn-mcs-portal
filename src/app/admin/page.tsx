import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-session";
import PostAuthToast from "@/components/post-auth-toast";

export default async function AdminHomePage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.admin.role === "GOVERNANCE") {
    redirect("/admin/onboard-requests");
  }

  if (session.admin.role === "SENIOR_MANAGER") {
    redirect("/admin/map-reports");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <PostAuthToast />
      <div className="mx-auto w-full max-w-6xl space-y-8 page-animate">
        <section className="admin-hero glass-panel">
          <div className="space-y-3">
            <p className="admin-hero-eyebrow">Admin Dashboard</p>
            <h1 className="admin-hero-title">Welcome back, {session.admin.name}.</h1>
            <p className="admin-hero-subtitle">
              Review submissions, track compliance, and manage partner operations with one view.
            </p>
          </div>
          <div className="admin-hero-actions">
            <Link className="btn btn-primary" href="/admin/partners">
              Review partners
            </Link>
            <Link className="btn btn-secondary" href="/admin/agents">
              Review agents
            </Link>
            <Link className="btn btn-secondary" href="/admin/businesses">
              Review locations
            </Link>
            <Link className="btn btn-secondary" href="/admin/forms">
              Manage forms
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Access</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link className="card admin-module-card" href="/admin/requests">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Requests</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                View and respond to partner training and restock requests.
              </p>
            </Link>
            <Link className="card admin-module-card" href="/admin/audit">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Audit Logs</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Track admin actions and compliance signals across the platform.
              </p>
            </Link>
            <Link className="card admin-module-card" href="/admin/reports">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15h6M9 11h6" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Reports</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Generate and download CSV exports of platform data.
              </p>
            </Link>
            <Link className="card admin-module-card" href="/admin/onboard-requests">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M22 11h-6" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Onboard Requests</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Review and process partner onboarding request forms.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
