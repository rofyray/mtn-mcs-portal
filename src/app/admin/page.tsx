import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-session";
import PostAuthToast from "@/components/post-auth-toast";

export default async function AdminHomePage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
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
              Review businesses
            </Link>
            <Link className="btn btn-secondary" href="/admin/forms">
              Manage forms
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Modules coming next</h2>
              <p className="text-sm text-gray-600">
                These tiles will light up as data flows in.
              </p>
            </div>
            <Link className="btn btn-secondary" href="/admin/audit">
              View audit logs
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="card admin-module-card">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 3v18M5 10h14" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Pending approvals</h3>
              <p className="text-xs text-gray-600">
                Quick queue for partners, agents, and businesses awaiting review.
              </p>
            </div>
            <div className="card admin-module-card">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3 12h18" />
                  <path d="M7 6h10M7 18h10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Recent activity</h3>
              <p className="text-xs text-gray-600">
                Live feed of the latest actions and approvals across the platform.
              </p>
            </div>
            <div className="card admin-module-card">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3 3h18v6H3z" />
                  <path d="M12 9v12" />
                  <path d="M7 21h10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Audit highlights</h3>
              <p className="text-xs text-gray-600">
                Top audit events and compliance signals summarized in one view.
              </p>
            </div>
            <div className="card admin-module-card">
              <div className="admin-module-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Form status</h3>
              <p className="text-xs text-gray-600">
                Track who has signed onboarding forms and what is still pending.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
