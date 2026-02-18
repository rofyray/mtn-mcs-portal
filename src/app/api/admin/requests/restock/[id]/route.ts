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

  const request_ = await prisma.restockRequest.findUnique({
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
      business: {
        select: { businessName: true, city: true },
      },
      replies: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request_) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ request: request_ });
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

  const existing = await prisma.restockRequest.findUnique({
    where: { id },
    include: {
      partnerProfile: {
        select: { userId: true, businessName: true, user: { select: { email: true } } },
      },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const updated = await prisma.restockRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  const isClosed = parsed.data.status === "CLOSED";

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "RESTOCK_REQUEST_CLOSED",
    targetType: "RestockRequest",
    targetId: id,
    metadata: { status: parsed.data.status },
  });

  await sendPartnerNotification(existing.partnerProfile.userId, {
    title: isClosed ? "Restock request closed" : "Restock request reopened",
    message: isClosed
      ? "Your restock request has been closed by an admin."
      : "Your restock request has been reopened by an admin.",
    category: isClosed ? "WARNING" : "INFO",
  });

  const partnerEmail = existing.partnerProfile.user?.email;
  if (partnerEmail) {
    const emailMsg = buildEmailTemplate({
      title: isClosed ? "Restock request closed" : "Restock request reopened",
      preheader: isClosed
        ? "Your restock request has been closed."
        : "Your restock request has been reopened.",
      message: [
        `Location: ${existing.partnerProfile.businessName ?? "MTN Community Shop"}`,
        isClosed
          ? "Your restock request has been closed by an admin. If you need further assistance, please submit a new request."
          : "Your restock request has been reopened by an admin. You can continue the conversation.",
      ],
    });
    await sendEmail({
      to: partnerEmail,
      subject: isClosed ? "Restock request closed" : "Restock request reopened",
      text: emailMsg.text,
      html: emailMsg.html,
    });
  }

  return NextResponse.json({ request: updated });
}
