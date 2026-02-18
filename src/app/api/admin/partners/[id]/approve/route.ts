import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndProfile } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { getCoordinatorEmailsForRegions, sendAdminNotification, sendPartnerNotification } from "@/lib/notifications";
import { getPartnerRegionCodes } from "@/lib/partner";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndProfile(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : 404;
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
        `Location: ${updated.businessName ?? "MTN Community Shop"}`,
        "Your submission is approved. You can now manage agents and locations in your dashboard.",
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Your partner submission was approved",
      text: partnerMessage.text,
      html: partnerMessage.html,
    });
  }

  const coordinatorEmails = await getCoordinatorEmailsForRegions(await getPartnerRegionCodes(id));
  const adminRecipients = coordinatorEmails.filter(Boolean).join(",");
  if (adminRecipients) {
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
  }

  await sendAdminNotification(access.admin.id, {
    title: "Partner submission approved",
    message: `Partner: ${updated.businessName ?? "Unknown"}`,
    category: "SUCCESS",
  });

  await sendPartnerNotification(updated.userId, {
    title: "Partner submission approved",
    message: "Your partner submission was approved. You can now manage agents and locations in your dashboard.",
    category: "SUCCESS",
  });

  return NextResponse.json({ profile: updated });
}
