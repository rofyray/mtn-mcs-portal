import type { Prisma } from "@prisma/client";
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
