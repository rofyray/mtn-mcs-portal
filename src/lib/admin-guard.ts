import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }

  const admin = session.admin;
  const regions = await prisma.adminRegionAssignment.findMany({
    where: { adminId: admin.id },
    select: { regionCode: true },
  });

  return {
    admin,
    regionCodes: regions.map((region) => region.regionCode),
  };
}
