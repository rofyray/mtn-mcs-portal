import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAuditEvent } from "@/lib/audit";

const replySchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    include: {
      partnerProfile: {
        select: { userId: true, businessName: true },
      },
    },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  if (feedback.status === "CLOSED") {
    return NextResponse.json({ error: "Feedback thread is closed" }, { status: 400 });
  }

  const reply = await prisma.feedbackReply.create({
    data: {
      feedbackId: id,
      message: parsed.data.message,
      senderType: "ADMIN",
      senderAdminId: adminContext.admin.id,
    },
  });

  await prisma.feedback.update({
    where: { id },
    data: { status: "RESPONDED" },
  });

  // Notify the partner
  await prisma.notification.create({
    data: {
      recipientType: "PARTNER",
      recipientUserId: feedback.partnerProfile.userId,
      title: "Feedback reply",
      message: `Admin responded to "${feedback.title}".`,
      category: "INFO",
    },
  });

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "FEEDBACK_REPLIED",
    targetType: "Feedback",
    targetId: id,
    metadata: { replyId: reply.id },
  });

  return NextResponse.json({ reply });
}
