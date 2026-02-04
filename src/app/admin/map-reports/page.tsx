import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-session";
import MapReportsDashboard from "@/components/map-reports-dashboard";

export default async function MapReportsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Only Senior Managers can access this page
  if (session.admin.role !== "SENIOR_MANAGER") {
    redirect("/admin");
  }

  return <MapReportsDashboard />;
}
