import prisma from "@/lib/db";
import { AdminRole, NotificationCategory } from "@prisma/client";

type NotificationInput = {
  title: string;
  message: string;
  category?: NotificationCategory;
};

/**
 * Broadcast notification to admins with specified roles.
 * Default: FULL, MANAGER, COORDINATOR (excludes SENIOR_MANAGER by design)
 */
export async function broadcastAdminNotification(
  input: NotificationInput,
  roles: AdminRole[] = [AdminRole.FULL, AdminRole.MANAGER, AdminRole.COORDINATOR]
) {
  const admins = await prisma.admin.findMany({
    where: { role: { in: roles }, enabled: true },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      recipientType: "ADMIN" as const,
      recipientAdminId: admin.id,
      title: input.title,
      message: input.message,
      category: input.category ?? "INFO",
    })),
  });
}

/**
 * Send notification to a specific admin by ID.
 */
export async function sendAdminNotification(
  adminId: string,
  input: NotificationInput
) {
  await prisma.notification.create({
    data: {
      recipientType: "ADMIN",
      recipientAdminId: adminId,
      title: input.title,
      message: input.message,
      category: input.category ?? "INFO",
    },
  });
}

/**
 * Notify all admins with given roles, optionally filtered by region.
 */
export async function notifyAdminsByRole(
  input: NotificationInput,
  roles: AdminRole[],
  regionCode?: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    role: { in: roles },
    enabled: true,
  };

  if (regionCode) {
    where.regions = { some: { regionCode } };
  }

  const admins = await prisma.admin.findMany({
    where,
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      recipientType: "ADMIN" as const,
      recipientAdminId: admin.id,
      title: input.title,
      message: input.message,
      category: input.category ?? "INFO",
    })),
  });
}
