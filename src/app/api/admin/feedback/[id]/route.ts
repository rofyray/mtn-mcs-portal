import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { sendPartnerNotification } from "@/lib/notifications";

const statusSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    include: {
      partnerProfile: {
        select: {
          id: true,
          userId: true,
          businessName: true,
          partnerFirstName: true,
          partnerSurname: true,
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  return NextResponse.json({ feedback });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    include: {
      partnerProfile: {
        select: { userId: true, businessName: true, user: { select: { email: true } } },
      },
    },
  });
  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  const isClosed = parsed.data.status === "CLOSED";

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "FEEDBACK_CLOSED",
    targetType: "Feedback",
    targetId: id,
    metadata: { status: parsed.data.status },
  });

  await sendPartnerNotification(feedback.partnerProfile.userId, {
    title: isClosed ? "Feedback closed" : "Feedback reopened",
    message: isClosed
      ? `Your feedback "${feedback.title}" has been closed by an admin.`
      : `Your feedback "${feedback.title}" has been reopened by an admin.`,
    category: isClosed ? "WARNING" : "INFO",
  });

  const partnerEmail = feedback.partnerProfile.user?.email;
  if (partnerEmail) {
    const emailMsg = buildEmailTemplate({
      title: isClosed ? "Feedback closed" : "Feedback reopened",
      preheader: isClosed
        ? `Your feedback "${feedback.title}" has been closed.`
        : `Your feedback "${feedback.title}" has been reopened.`,
      message: [
        `Feedback: ${feedback.title}`,
        isClosed
          ? "Your feedback has been closed by an admin. If you need further assistance, please submit new feedback."
          : "Your feedback has been reopened by an admin. You can continue the conversation.",
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: isClosed ? "Feedback closed" : "Feedback reopened",
      text: emailMsg.text,
      html: emailMsg.html,
    });
  }

  return NextResponse.json({ feedback: updated });
}
