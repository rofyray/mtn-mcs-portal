import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getApprovedPartnerProfile } from "@/lib/partner";

export async function GET() {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const forms = await prisma.formRequest.findMany({
    where: { partnerProfileId: result.profile.id },
    include: { signature: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ forms });
}
