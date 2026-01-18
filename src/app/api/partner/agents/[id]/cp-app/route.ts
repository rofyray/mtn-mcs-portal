import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getApprovedPartnerProfile } from "@/lib/partner";

const cpAppSchema = z.object({
  cpAppNumber: z.string().trim().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = cpAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const agent = await prisma.agent.findFirst({
    where: {
      id,
      partnerProfileId: result.profile.id,
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const updated = await prisma.agent.update({
    where: { id: agent.id },
    data: { cpAppNumber: parsed.data.cpAppNumber },
  });

  return NextResponse.json({ agent: updated });
}
