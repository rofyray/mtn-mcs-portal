import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getPartnerProfile } from "@/lib/partner";

export async function GET() {
  const result = await getPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      recipientType: "PARTNER",
      recipientUserId: result.user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}
