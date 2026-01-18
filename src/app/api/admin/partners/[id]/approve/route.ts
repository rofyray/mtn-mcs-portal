import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndProfile } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndProfile(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const updated = await prisma.partnerProfile.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      deniedAt: null,
      denialReason: null,
    },
    include: { user: { select: { email: true } } },
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: "PARTNER_APPROVED",
    targetType: "PartnerProfile",
    targetId: id,
  });

  const partnerEmail = updated.user?.email;
  if (partnerEmail) {
    const partnerMessage = buildEmailTemplate({
      title: "Your partner submission was approved",
      preheader: "Your submission has been approved.",
      message: [
        `Business: ${updated.businessName ?? "MTN Community Shop"}`,
        "Your submission is approved. You can now manage agents and businesses in your dashboard.",
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Your partner submission was approved",
      text: partnerMessage.text,
      html: partnerMessage.html,
    });
  }

  const adminRecipients = Array.from(
    new Set([access.admin.email, requiredEnv.smtpDefaultRecipient].filter(Boolean))
  ).join(",");
  const adminMessage = buildEmailTemplate({
    title: "Partner submission approved",
    preheader: "A partner submission was approved.",
    message: [
      `Admin: ${access.admin.name} (${access.admin.email})`,
      `Partner: ${updated.businessName ?? "Unknown"}`,
    ],
  });
  await sendEmail({
    to: adminRecipients,
    subject: "Partner submission approved",
    text: adminMessage.text,
    html: adminMessage.html,
  });

  return NextResponse.json({ profile: updated });
}
