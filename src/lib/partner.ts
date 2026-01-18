import prisma from "@/lib/db";
import { getPartnerSession } from "@/lib/session";

export async function getPartnerProfile() {
  const session = await getPartnerSession();
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return null;
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return null;
  }

  return { user, profile };
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
