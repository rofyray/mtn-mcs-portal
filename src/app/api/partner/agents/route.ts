import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { agentSchema } from "@/lib/agent";
import { getApprovedPartnerProfile } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

export async function GET() {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const [agents, businesses] = await Promise.all([
    prisma.agent.findMany({
      where: { partnerProfileId: result.profile.id },
      include: { business: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.business.findMany({
      where: { partnerProfileId: result.profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    agents,
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
  const parsed = agentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  // Validate that the business belongs to this partner
  const business = await prisma.business.findFirst({
    where: {
      id: parsed.data.businessId,
      partnerProfileId: result.profile.id,
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Invalid business" }, { status: 400 });
  }

  const { cpAppNumber, agentUsername, minervaReferralCode, ...agentData } = parsed.data;
  const agent = await prisma.agent.create({
    data: {
      partnerProfileId: result.profile.id,
      ...agentData,
      ...(cpAppNumber ? { cpAppNumber } : {}),
      ...(agentUsername ? { agentUsername } : {}),
      ...(minervaReferralCode ? { minervaReferralCode } : {}),
    },
  });

  return NextResponse.json({ agent });
}
