import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getApprovedPartnerProfile } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

const credentialsSchema = z
  .object({
    cpAppNumber: z.string().trim().regex(/^\d{1,10}$/, "CP app number must be 1-10 digits").optional(),
    agentUsername: z.string().trim().min(1).optional(),
    minervaReferralCode: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9]+$/, "Referral code must be alphanumeric")
      .optional(),
  })
  .refine(
    (d) => d.cpAppNumber || d.agentUsername || d.minervaReferralCode,
    { message: "At least one field is required" }
  );

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
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
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

  const data: Record<string, string> = {};
  if (parsed.data.cpAppNumber) data.cpAppNumber = parsed.data.cpAppNumber;
  if (parsed.data.agentUsername) data.agentUsername = parsed.data.agentUsername;
  if (parsed.data.minervaReferralCode)
    data.minervaReferralCode = parsed.data.minervaReferralCode;

  const updated = await prisma.agent.update({
    where: { id: agent.id },
    data,
  });

  return NextResponse.json({ agent: updated });
}
