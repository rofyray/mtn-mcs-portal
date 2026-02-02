import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { agentSchema } from "@/lib/agent";
import { getApprovedPartnerProfile } from "@/lib/partner";

export async function GET() {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const agents = await prisma.agent.findMany({
    where: { partnerProfileId: result.profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    agents,
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
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { cpAppNumber, ...agentData } = parsed.data;
  const agent = await prisma.agent.create({
    data: {
      partnerProfileId: result.profile.id,
      ...agentData,
      ...(cpAppNumber ? { cpAppNumber } : {}),
    },
  });

  return NextResponse.json({ agent });
}
