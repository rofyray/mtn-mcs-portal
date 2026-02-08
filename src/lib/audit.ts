import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getFieldLabel, URL_FIELDS } from "@/lib/audit-field-labels";

export type FieldChange = {
  field: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
  isUrl?: boolean;
};

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Compare old entity data with the new update payload and return
 * an array of field-level changes for audit logging.
 */
export function buildFieldChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const key of Object.keys(newData)) {
    const oldVal = normalizeValue(oldData[key]);
    const newVal = normalizeValue(newData[key]);

    if (oldVal !== newVal) {
      changes.push({
        field: key,
        label: getFieldLabel(key),
        oldValue: oldVal,
        newValue: newVal,
        ...(URL_FIELDS.has(key) ? { isUrl: true } : {}),
      });
    }
  }

  return changes;
}

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
