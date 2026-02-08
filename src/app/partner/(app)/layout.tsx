import { redirect } from "next/navigation";

import prisma from "@/lib/db";
import { getPartnerSession } from "@/lib/session";
import SuspendedOverlay from "@/components/suspended-overlay";

export default async function PartnerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPartnerSession();
  const email = session?.user?.email;

  if (!email) {
    redirect("/partner/login");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      partnerProfile: {
        select: {
          status: true,
          suspended: true,
        },
      },
    },
  });

  if (user?.partnerProfile?.status !== "APPROVED") {
    redirect("/onboarding");
  }

  if (user.partnerProfile.suspended) {
    return <SuspendedOverlay />;
  }

  return children;
}
