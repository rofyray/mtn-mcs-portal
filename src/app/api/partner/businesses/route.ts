import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { businessSchema } from "@/lib/business";
import { getApprovedPartnerProfile } from "@/lib/partner";

export async function GET() {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const businesses = await prisma.business.findMany({
    where: { partnerProfileId: result.profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    businesses,
    partnerBusinessName: result.profile.businessName ?? "",
  });
}

export async function POST(request: Request) {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = businessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const business = await prisma.business.create({
    data: {
      partnerProfileId: result.profile.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ business });
}
