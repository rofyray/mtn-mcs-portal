import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

export async function logAuditEvent(params: {
  adminId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const { adminId, action, targetType, targetId, metadata } = params;

  await prisma.auditLog.create({
    data: {
      adminId: adminId ?? null,
      action: action as never,
      targetType,
      targetId,
      metadata,
    },
  });
}

export async function logAuditEvents(
  events: Array<{
    adminId?: string | null;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Prisma.InputJsonValue;
  }>
) {
  if (events.length === 0) return;

  await prisma.auditLog.createMany({
    data: events.map(({ adminId, action, targetType, targetId, metadata }) => ({
      adminId: adminId ?? null,
      action: action as never,
      targetType,
      targetId,
      metadata: metadata ?? Prisma.JsonNull,
    })),
  });
}
