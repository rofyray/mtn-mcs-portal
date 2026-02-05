import { getAdminSession } from "@/lib/admin-session";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }

  const admin = session.admin;

  return {
    admin,
    regionCodes: admin.regions.map((region) => region.regionCode),
  };
}
