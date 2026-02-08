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

  const trainingRequest = await prisma.trainingRequest.findUnique({
    where: { id },
    include: {
      partnerProfile: {
        select: { userId: true, businessName: true },
      },
    },
  });

  if (!trainingRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (trainingRequest.status === "CLOSED") {
    return NextResponse.json({ error: "Request thread is closed" }, { status: 400 });
  }

  const reply = await prisma.trainingRequestReply.create({
    data: {
      trainingRequestId: id,
      message: parsed.data.message,
      senderType: "ADMIN",
      senderAdminId: adminContext.admin.id,
    },
  });

  await prisma.trainingRequest.update({
    where: { id },
    data: { status: "RESPONDED" },
  });

  await prisma.notification.create({
    data: {
      recipientType: "PARTNER",
      recipientUserId: trainingRequest.partnerProfile.userId,
      title: "Training request reply",
      message: `Admin responded to your training request.`,
      category: "INFO",
    },
  });

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "TRAINING_REQUEST_REPLIED",
    targetType: "TrainingRequest",
    targetId: id,
    metadata: { replyId: reply.id },
  });

  return NextResponse.json({ reply });
}
