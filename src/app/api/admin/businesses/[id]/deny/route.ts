import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminAndBusiness } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { getCoordinatorEmailsForRegions, sendAdminNotification, sendPartnerNotification } from "@/lib/notifications";
import { formatZodError } from "@/lib/validation";

const denialSchema = z.object({
  reason: z.string().trim().min(1, "Denial reason is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndBusiness(id);
  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const body = await request.json();
  const parsed = denialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      status: "DENIED",
      deniedAt: new Date(),
      denialReason: parsed.data.reason,
      approvedAt: null,
    },
    include: { partnerProfile: { include: { user: { select: { email: true } } } } },
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: "BUSINESS_DENIED",
    targetType: "Business",
    targetId: id,
    metadata: { reason: parsed.data.reason },
  });

  const partnerEmail = updated.partnerProfile.user?.email;
  if (partnerEmail) {
    const partnerMessage = buildEmailTemplate({
      title: "A location submission was denied",
      preheader: "A location submission needs updates.",
      message: [
        `Location: ${updated.businessName}`,
        `Partner: ${updated.partnerProfile.businessName ?? "MTN Community Shop"}`,
        `Reason: ${parsed.data.reason}`,
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Location submission denied",
      text: partnerMessage.text,
      html: partnerMessage.html,
    });
  }

  const coordinatorEmails = await getCoordinatorEmailsForRegions([updated.addressRegionCode]);
  const adminRecipients = coordinatorEmails.filter(Boolean).join(",");
  if (adminRecipients) {
    const adminMessage = buildEmailTemplate({
      title: "Location submission denied",
      preheader: "A location submission was denied.",
      message: [
        `Admin: ${access.admin.name} (${access.admin.email})`,
        `Location: ${updated.businessName}`,
        `Partner: ${updated.partnerProfile.businessName ?? "Unknown"}`,
        `Reason: ${parsed.data.reason}`,
      ],
    });
    await sendEmail({
      to: adminRecipients,
      subject: "Location submission denied",
      text: adminMessage.text,
      html: adminMessage.html,
    });
  }

  await sendAdminNotification(access.admin.id, {
    title: "Location submission denied",
    message: `Location: ${updated.businessName}`,
    category: "WARNING",
  });

  await sendPartnerNotification(updated.partnerProfile.userId, {
    title: "Location denied",
    message: `Your location ${updated.businessName} was denied. Reason: ${parsed.data.reason}`,
    category: "WARNING",
  });

  return NextResponse.json({ business: updated });
}
