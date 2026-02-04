import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function getAdminAndProfile(profileId: string) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return { error: "unauthorized" as const };
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    return { error: "not_found" as const };
  }

  // Partners no longer have direct location - FULL access admins can view all,
  // COORDINATOR admins can view all partners (region filtering now through businesses)
  return { admin: adminContext.admin, profile } as const;
}

export async function getAdminAndAgent(agentId: string) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return { error: "unauthorized" as const };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { business: true },
  });

  if (!agent) {
    return { error: "not_found" as const };
  }

  if (
    adminContext.admin.role !== "FULL" &&
    !adminContext.regionCodes.includes(agent.business.addressRegionCode)
  ) {
    return { error: "forbidden" as const };
  }

  return { admin: adminContext.admin, agent } as const;
}

export async function getAdminAndBusiness(businessId: string) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return { error: "unauthorized" as const };
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    return { error: "not_found" as const };
  }

  if (
    adminContext.admin.role !== "FULL" &&
    !adminContext.regionCodes.includes(business.addressRegionCode)
  ) {
    return { error: "forbidden" as const };
  }

  return { admin: adminContext.admin, business } as const;
}
