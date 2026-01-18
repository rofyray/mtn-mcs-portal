import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndAgent } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndAgent(id);
  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      deniedAt: null,
      denialReason: null,
    },
    include: { partnerProfile: { include: { user: { select: { email: true } } } } },
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: "AGENT_APPROVED",
    targetType: "Agent",
    targetId: id,
  });

  const partnerEmail = updated.partnerProfile.user?.email;
  if (partnerEmail) {
    const partnerMessage = buildEmailTemplate({
      title: "An agent submission was approved",
      preheader: "An agent submission has been approved.",
      message: [
        `Agent: ${updated.firstName} ${updated.surname}`,
        `Partner: ${updated.partnerProfile.businessName ?? "MTN Community Shop"}`,
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Agent submission approved",
      text: partnerMessage.text,
      html: partnerMessage.html,
    });
  }

  const adminRecipients = Array.from(
    new Set([access.admin.email, requiredEnv.smtpDefaultRecipient].filter(Boolean))
  ).join(",");
  const adminMessage = buildEmailTemplate({
    title: "Agent submission approved",
    preheader: "An agent submission was approved.",
    message: [
      `Admin: ${access.admin.name} (${access.admin.email})`,
      `Agent: ${updated.firstName} ${updated.surname}`,
      `Partner: ${updated.partnerProfile.businessName ?? "Unknown"}`,
    ],
  });
  await sendEmail({
    to: adminRecipients,
    subject: "Agent submission approved",
    text: adminMessage.text,
    html: adminMessage.html,
  });

  return NextResponse.json({ agent: updated });
}
