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

  const restockRequest = await prisma.restockRequest.findUnique({
    where: { id },
    include: {
      partnerProfile: {
        select: { userId: true, businessName: true },
      },
    },
  });

  if (!restockRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (restockRequest.status === "CLOSED") {
    return NextResponse.json({ error: "Request thread is closed" }, { status: 400 });
  }

  const reply = await prisma.restockRequestReply.create({
    data: {
      restockRequestId: id,
      message: parsed.data.message,
      senderType: "ADMIN",
      senderAdminId: adminContext.admin.id,
    },
  });

  await prisma.restockRequest.update({
    where: { id },
    data: { status: "RESPONDED" },
  });

  await prisma.notification.create({
    data: {
      recipientType: "PARTNER",
      recipientUserId: restockRequest.partnerProfile.userId,
      title: "Restock request reply",
      message: `Admin responded to your restock request.`,
      category: "INFO",
    },
  });

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "RESTOCK_REQUEST_REPLIED",
    targetType: "RestockRequest",
    targetId: id,
    metadata: { replyId: reply.id },
  });

  return NextResponse.json({ reply });
}
