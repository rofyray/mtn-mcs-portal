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

  const request_ = await prisma.trainingRequest.findUnique({
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

  const existing = await prisma.trainingRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const updated = await prisma.trainingRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  await logAuditEvent({
    adminId: adminContext.admin.id,
    action: "TRAINING_REQUEST_CLOSED",
    targetType: "TrainingRequest",
    targetId: id,
    metadata: { status: parsed.data.status },
  });

  return NextResponse.json({ request: updated });
}
