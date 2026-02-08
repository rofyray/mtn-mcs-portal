import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-session";
import AdminActionsToggle from "@/components/admin-actions-toggle";
import AdminManagementSection from "@/components/admin-management-section";
import PartnerManagementSection from "@/components/partner-management-section";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  const adminRole = session.admin.role;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Admin preferences and permissions.</p>
        </div>

        {adminRole === "FULL" || adminRole === "MANAGER" ? (
          <>
            <section className="card space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Submission Actions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable approve/deny controls for full-access admins. This is off by default.
                </p>
              </div>
              <AdminActionsToggle />
            </section>

            {adminRole === "FULL" && (
              <>
                <section className="card space-y-4">
                  <AdminManagementSection />
                </section>

                <section className="card space-y-4">
                  <PartnerManagementSection />
                </section>
              </>
            )}
          </>
        ) : (
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Settings are currently limited to full-access admins.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
