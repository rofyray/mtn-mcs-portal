import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndProfile } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndProfile(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  if (access.admin.role !== "FULL") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const confirmBusinessName = body.confirmBusinessName;

  if (
    !confirmBusinessName ||
    confirmBusinessName.toLowerCase() !==
      (access.profile.businessName ?? "").toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Business name does not match" },
      { status: 400 }
    );
  }

  // Fetch partner data + user email before deletion
  const partner = await prisma.partnerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!partner || !partner.user) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const partnerEmail = partner.user.email;
  const partnerName = `${partner.partnerFirstName ?? ""} ${partner.partnerSurname ?? ""}`.trim();
  const businessName = partner.businessName ?? "Unknown";
  const userId = partner.user.id;

  // Send farewell email before deletion
  if (partnerEmail) {
    const msg = buildEmailTemplate({
      title: "Your partner account has been removed",
      preheader: "Your partner account has been permanently removed.",
      message: [
        `Business: ${businessName}`,
        "Your partner account and all associated data have been permanently removed from the MTN Community Shop platform by an administrator.",
        "If you believe this is an error, please contact support.",
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Your partner account has been removed",
      text: msg.text,
      html: msg.html,
    });
  }

  // Delete notifications for this user
  await prisma.notification.deleteMany({
    where: { recipientUserId: userId },
  });

  // Log audit event before deletion
  await logAuditEvent({
    adminId: access.admin.id,
    action: "PARTNER_DELETED",
    targetType: "PartnerProfile",
    targetId: id,
    metadata: {
      partnerName,
      email: partnerEmail,
      businessName,
    },
  });

  // Delete user record — cascades to PartnerProfile and all related records
  await prisma.user.delete({
    where: { id: userId },
  });

  // Send admin notification email
  const adminRecipients = Array.from(
    new Set(
      [access.admin.email, requiredEnv.smtpDefaultRecipient].filter(Boolean)
    )
  ).join(",");
  const adminMsg = buildEmailTemplate({
    title: "Partner permanently deleted",
    preheader: "A partner account was permanently deleted.",
    message: [
      `Admin: ${access.admin.name} (${access.admin.email})`,
      `Partner: ${partnerName} (${partnerEmail ?? "no email"})`,
      `Business: ${businessName}`,
      "All associated data has been cascade-deleted.",
    ],
  });
  await sendEmail({
    to: adminRecipients,
    subject: "Partner permanently deleted",
    text: adminMsg.text,
    html: adminMsg.html,
  });

  return NextResponse.json({ success: true });
}
