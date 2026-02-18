import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";

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
        select: { userId: true, businessName: true, user: { select: { email: true } } },
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

  const partnerEmail = restockRequest.partnerProfile.user?.email;
  if (partnerEmail) {
    const emailMsg = buildEmailTemplate({
      title: "Admin responded to your restock request",
      preheader: "You have a new reply on your restock request.",
      message: [
        `Location: ${restockRequest.partnerProfile.businessName ?? "MTN Community Shop"}`,
        "An admin has responded to your restock request. Log in to view the reply.",
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: "Admin responded to your restock request",
      text: emailMsg.text,
      html: emailMsg.html,
    });
  }

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "RESTOCK_REQUEST_REPLIED",
    targetType: "RestockRequest",
    targetId: id,
    metadata: { replyId: reply.id },
  });

  return NextResponse.json({ reply });
}
