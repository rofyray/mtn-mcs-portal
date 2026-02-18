import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only coordinators can access pay slips
  if (session.admin.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const partnerId = searchParams.get("partnerId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Always region-scoped for coordinators
  if (session.regionCodes.length > 0) {
    where.partnerProfile = {
      businesses: {
        some: { addressRegionCode: { in: session.regionCodes } },
      },
    };
  }

  if (partnerId) {
    where.partnerProfileId = partnerId;
  }

  const paySlips = await prisma.paySlip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      partnerProfile: {
        select: {
          id: true,
          businessName: true,
          partnerFirstName: true,
          partnerSurname: true,
        },
      },
    },
  });

  return NextResponse.json(
    { paySlips },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}
