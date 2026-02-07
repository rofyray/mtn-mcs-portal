import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { broadcastAdminNotification } from "@/lib/notifications";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";
import { getApprovedPartnerProfile } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

const trainingSchema = z.object({
  agentIds: z.array(z.string().min(1)).min(1, "At least one agent must be selected"),
  message: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = trainingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const agents = await prisma.agent.findMany({
    where: {
      id: { in: parsed.data.agentIds },
      partnerProfileId: result.profile.id,
    },
  });

  const agentNames = agents.map((agent) => `${agent.firstName} ${agent.surname}`);

  const requestRecord = await prisma.trainingRequest.create({
    data: {
      partnerProfileId: result.profile.id,
      agentIds: agents.map((agent) => agent.id),
      agentNames,
      message: parsed.data.message,
    },
  });

  await broadcastAdminNotification({
    title: "Training request",
    message: `${result.profile.businessName ?? "Partner"} requested training for ${agentNames.join(", ")}.`,
    category: "INFO",
  });

  const email = buildEmailTemplate({
    title: "New training request",
    preheader: "A partner submitted a training request.",
    message: [
      `Partner: ${result.profile.businessName ?? "Unknown"}`,
      parsed.data.message ? `Message: ${parsed.data.message}` : "Message: -",
    ],
    bullets: agentNames.length ? [`Agents: ${agentNames.join(", ")}`] : undefined,
  });

  await sendEmail({
    to: requiredEnv.smtpDefaultRecipient,
    subject: "Partner training request",
    text: email.text,
    html: email.html,
  });

  return NextResponse.json({ request: requestRecord });
}
