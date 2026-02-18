import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndProfile } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";
import { sendPartnerNotification } from "@/lib/notifications";

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

  if (access.admin.role !== "FULL") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (access.profile.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Only approved partners can be suspended" },
      { status: 400 }
    );
  }

  const nowSuspended = !access.profile.suspended;

  const updated = await prisma.partnerProfile.update({
    where: { id },
    data: {
      suspended: nowSuspended,
      suspendedAt: nowSuspended ? new Date() : null,
    },
    include: {
      user: { select: { email: true } },
    },
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: nowSuspended ? "PARTNER_SUSPENDED" : "PARTNER_UNSUSPENDED",
    targetType: "PartnerProfile",
    targetId: id,
    metadata: {
      businessName: access.profile.businessName,
      partnerName: `${access.profile.partnerFirstName ?? ""} ${access.profile.partnerSurname ?? ""}`.trim(),
    },
  });

  const partnerEmail = updated.user?.email;
  if (partnerEmail) {
    if (nowSuspended) {
      const msg = buildEmailTemplate({
        title: "Your account has been suspended",
        preheader: "Your partner account has been suspended.",
        message: [
          `Location: ${updated.businessName ?? "MTN Community Shop"}`,
          "Your partner account has been suspended by an administrator. You will not be able to access the platform until your account is reactivated.",
          "If you believe this is an error, please contact support.",
        ],
      });
      await sendEmail({
        to: partnerEmail,
        subject: "Your account has been suspended",
        text: msg.text,
        html: msg.html,
      });
    } else {
      const msg = buildEmailTemplate({
        title: "Your account has been reactivated",
        preheader: "Your partner account has been reactivated.",
        message: [
          `Location: ${updated.businessName ?? "MTN Community Shop"}`,
          "Your partner account has been reactivated. You can now log in and access the platform again.",
        ],
        cta: {
          label: "Log in to your dashboard",
          url: `${requiredEnv.nextAuthUrl}/partner/login`,
        },
      });
      await sendEmail({
        to: partnerEmail,
        subject: "Your account has been reactivated",
        text: msg.text,
        html: msg.html,
      });
    }
  }

  const adminRecipients = Array.from(
    new Set(
      [access.admin.email, requiredEnv.smtpDefaultRecipient].filter(Boolean)
    )
  ).join(",");
  const adminMsg = buildEmailTemplate({
    title: nowSuspended ? "Partner suspended" : "Partner unsuspended",
    preheader: nowSuspended
      ? "A partner account was suspended."
      : "A partner account was reactivated.",
    message: [
      `Admin: ${access.admin.name} (${access.admin.email})`,
      `Partner: ${updated.businessName ?? "Unknown"}`,
      `Action: ${nowSuspended ? "Suspended" : "Unsuspended"}`,
    ],
  });
  await sendEmail({
    to: adminRecipients,
    subject: nowSuspended ? "Partner suspended" : "Partner unsuspended",
    text: adminMsg.text,
    html: adminMsg.html,
  });

  await sendPartnerNotification(updated.userId, {
    title: nowSuspended ? "Account suspended" : "Account reactivated",
    message: nowSuspended
      ? "Your partner account has been suspended. Contact support if you believe this is an error."
      : "Your partner account has been reactivated. You can now access the platform again.",
    category: nowSuspended ? "WARNING" : "SUCCESS",
  });

  return NextResponse.json({ profile: updated });
}
