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

  if (
    adminContext.admin.role !== "FULL" &&
    (!profile.addressRegionCode ||
      !adminContext.regionCodes.includes(profile.addressRegionCode))
  ) {
    return { error: "forbidden" as const };
  }

  return { admin: adminContext.admin, profile } as const;
}

export async function getAdminAndAgent(agentId: string) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return { error: "unauthorized" as const };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    return { error: "not_found" as const };
  }

  if (
    adminContext.admin.role !== "FULL" &&
    !adminContext.regionCodes.includes(agent.addressRegionCode)
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
