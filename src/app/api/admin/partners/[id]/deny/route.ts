import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminAndProfile } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { getCoordinatorEmailsForRegions, sendAdminNotification, sendPartnerNotification } from "@/lib/notifications";
import { getPartnerRegionCodes } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

const denialSchema = z.object({
  reason: z.string().trim().min(1, "Denial reason is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndProfile(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const body = await request.json();
  const parsed = denialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const updated = await prisma.partnerProfile.update({
    where: { id },
    data: {
      status: "DENIED",
      deniedAt: new Date(),
      denialReason: parsed.data.reason,
      approvedAt: null,
    },
    include: { user: { select: { email: true } } },
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: "PARTNER_DENIED",
    targetType: "PartnerProfile",
    targetId: id,
    metadata: { reason: parsed.data.reason },
  });

  const partnerEmail = updated.user?.email;
  if (partnerEmail) {
    const partnerMessage = buildEmailTemplate({
      title: "Your partner submission was denied",
      preheader: "Your submission needs updates.",
      message: [
        `Location: ${updated.businessName ?? "MTN Community Shop"}`,
        `Reason: ${parsed.data.reason}`,
        "Please update your submission and resubmit when ready.",
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Your partner submission was denied",
      text: partnerMessage.text,
      html: partnerMessage.html,
    });
  }

  const coordinatorEmails = await getCoordinatorEmailsForRegions(await getPartnerRegionCodes(id));
  const adminRecipients = coordinatorEmails.filter(Boolean).join(",");
  if (adminRecipients) {
    const adminMessage = buildEmailTemplate({
      title: "Partner submission denied",
      preheader: "A partner submission was denied.",
      message: [
        `Admin: ${access.admin.name} (${access.admin.email})`,
        `Partner: ${updated.businessName ?? "Unknown"}`,
        `Reason: ${parsed.data.reason}`,
      ],
    });
    await sendEmail({
      to: adminRecipients,
      subject: "Partner submission denied",
      text: adminMessage.text,
      html: adminMessage.html,
    });
  }

  await sendAdminNotification(access.admin.id, {
    title: "Partner submission denied",
    message: `Partner: ${updated.businessName ?? "Unknown"}`,
    category: "WARNING",
  });

  await sendPartnerNotification(updated.userId, {
    title: "Partner submission denied",
    message: `Your partner submission was denied. Reason: ${parsed.data.reason}`,
    category: "WARNING",
  });

  return NextResponse.json({ profile: updated });
}
