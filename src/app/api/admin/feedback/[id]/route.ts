import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAuditEvent } from "@/lib/audit";

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

  const feedback = await prisma.feedback.findUnique({ where: { id } });
  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "FEEDBACK_CLOSED",
    targetType: "Feedback",
    targetId: id,
    metadata: { status: parsed.data.status },
  });

  return NextResponse.json({ feedback: updated });
}
