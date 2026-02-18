import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndBusiness } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { getCoordinatorEmailsForRegions, sendAdminNotification, sendPartnerNotification } from "@/lib/notifications";

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
      title: "A location submission was approved",
      preheader: "A location submission has been approved.",
      message: [
        `Location: ${updated.businessName}`,
        `Partner: ${updated.partnerProfile.businessName ?? "MTN Community Shop"}`,
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Location submission approved",
      text: partnerMessage.text,
      html: partnerMessage.html,
    });
  }

  const coordinatorEmails = await getCoordinatorEmailsForRegions([updated.addressRegionCode]);
  const adminRecipients = coordinatorEmails.filter(Boolean).join(",");
  if (adminRecipients) {
    const adminMessage = buildEmailTemplate({
      title: "Location submission approved",
      preheader: "A location submission was approved.",
      message: [
        `Admin: ${access.admin.name} (${access.admin.email})`,
        `Location: ${updated.businessName}`,
        `Partner: ${updated.partnerProfile.businessName ?? "Unknown"}`,
      ],
    });
    await sendEmail({
      to: adminRecipients,
      subject: "Location submission approved",
      text: adminMessage.text,
      html: adminMessage.html,
    });
  }

  await sendAdminNotification(access.admin.id, {
    title: "Location submission approved",
    message: `Location: ${updated.businessName}`,
    category: "SUCCESS",
  });

  await sendPartnerNotification(updated.partnerProfile.userId, {
    title: "Location approved",
    message: `Your location ${updated.businessName} was approved.`,
    category: "SUCCESS",
  });

  return NextResponse.json({ business: updated });
}
