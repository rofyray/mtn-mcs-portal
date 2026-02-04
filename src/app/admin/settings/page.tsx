import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-session";
import AdminActionsToggle from "@/components/admin-actions-toggle";
import AdminManagementSection from "@/components/admin-management-section";

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
          <p className="text-sm text-gray-600">Admin preferences and permissions.</p>
        </div>

        {adminRole === "FULL" ? (
          <>
            <section className="card space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Submission actions</h2>
                <p className="text-sm text-gray-600">
                  Enable approve/deny controls for full-access admins. This is off by default.
                </p>
              </div>
              <AdminActionsToggle />
            </section>

            <section className="card space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Admin Management</h2>
                <p className="text-sm text-gray-600">
                  Manage admin accounts, enable/disable access, and assign regions.
                </p>
              </div>
              <AdminManagementSection />
            </section>
          </>
        ) : (
          <div className="card">
            <p className="text-sm text-gray-600">
              Settings are currently limited to full-access admins.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
