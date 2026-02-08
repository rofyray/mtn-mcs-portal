import prisma from "@/lib/db";
import { getPartnerSession } from "@/lib/session";

export async function getPartnerProfile() {
  const session = await getPartnerSession();
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { partnerProfile: true },
  });

  if (!user || !user.partnerProfile) {
    return null;
  }

  return { user, profile: user.partnerProfile };
}

export async function getPartnerRegionCodes(partnerProfileId: string): Promise<string[]> {
  const businesses = await prisma.business.findMany({
    where: { partnerProfileId },
    select: { addressRegionCode: true },
    distinct: ["addressRegionCode"],
  });
  return businesses.map((b) => b.addressRegionCode);
}

export async function getApprovedPartnerProfile() {
  const result = await getPartnerProfile();
  if (!result) {
    return null;
  }

  if (result.profile.status !== "APPROVED") {
    return { error: "not_approved" as const };
  }

  return result;
}
