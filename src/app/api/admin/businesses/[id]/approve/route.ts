import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndBusiness } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndBusiness(id);
  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const updated = await prisma.business.update({
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
    action: "BUSINESS_APPROVED",
    targetType: "Business",
    targetId: id,
  });

  const partnerEmail = updated.partnerProfile.user?.email;
  if (partnerEmail) {
    const partnerMessage = buildEmailTemplate({
      title: "A business submission was approved",
      preheader: "A business submission has been approved.",
      message: [
        `Business: ${updated.businessName}`,
        `Partner: ${updated.partnerProfile.businessName ?? "MTN Community Shop"}`,
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Business submission approved",
      text: partnerMessage.text,
      html: partnerMessage.html,
    });
  }

  const adminRecipients = Array.from(
    new Set([access.admin.email, requiredEnv.smtpDefaultRecipient].filter(Boolean))
  ).join(",");
  const adminMessage = buildEmailTemplate({
    title: "Business submission approved",
    preheader: "A business submission was approved.",
    message: [
      `Admin: ${access.admin.name} (${access.admin.email})`,
      `Business: ${updated.businessName}`,
      `Partner: ${updated.partnerProfile.businessName ?? "Unknown"}`,
    ],
  });
  await sendEmail({
    to: adminRecipients,
    subject: "Business submission approved",
    text: adminMessage.text,
    html: adminMessage.html,
  });

  return NextResponse.json({ business: updated });
}
