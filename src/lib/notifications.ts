import prisma from "@/lib/db";
import { AdminRole, NotificationCategory } from "@prisma/client";

/**
 * Get emails of enabled COORDINATOR admins assigned to given region(s).
 */
export async function getCoordinatorEmailsForRegions(regionCodes: string[]): Promise<string[]> {
  if (regionCodes.length === 0) return [];
  const coordinators = await prisma.admin.findMany({
    where: {
      role: "COORDINATOR",
      enabled: true,
      regions: { some: { regionCode: { in: regionCodes } } },
    },
    select: { email: true },
  });
  return coordinators.map((c) => c.email);
}

type NotificationInput = {
  title: string;
  message: string;
  category?: NotificationCategory;
};

/**
 * Broadcast notification to admins with specified roles.
 * Default: FULL, MANAGER, COORDINATOR (excludes SENIOR_MANAGER by design)
 *
 * When regionCodes is provided, COORDINATOR admins are filtered to only
 * those with region assignments matching the given codes. FULL and MANAGER
 * admins always receive the notification regardless of region.
 */
export async function broadcastAdminNotification(
  input: NotificationInput,
  roles: AdminRole[] = [AdminRole.FULL, AdminRole.MANAGER, AdminRole.COORDINATOR],
  regionCodes?: string[]
) {
  const hasRegionFilter = regionCodes && regionCodes.length > 0;
  const adminIds = new Set<string>();

  if (hasRegionFilter) {
    // Global roles (FULL, MANAGER) always receive notifications
    const globalRoles = roles.filter((r) => r !== AdminRole.COORDINATOR);
    if (globalRoles.length > 0) {
      const globalAdmins = await prisma.admin.findMany({
        where: { role: { in: globalRoles }, enabled: true },
        select: { id: true },
      });
      for (const a of globalAdmins) adminIds.add(a.id);
    }

    // COORDINATORs filtered by region
    if (roles.includes(AdminRole.COORDINATOR)) {
      const regionAdmins = await prisma.admin.findMany({
        where: {
          role: AdminRole.COORDINATOR,
          enabled: true,
          regions: { some: { regionCode: { in: regionCodes } } },
        },
        select: { id: true },
      });
      for (const a of regionAdmins) adminIds.add(a.id);
    }
  } else {
    // No region filter — fall back to current behavior (all matching roles)
    const admins = await prisma.admin.findMany({
      where: { role: { in: roles }, enabled: true },
      select: { id: true },
    });
    for (const a of admins) adminIds.add(a.id);
  }

  if (adminIds.size === 0) return;

  await prisma.notification.createMany({
    data: [...adminIds].map((id) => ({
      recipientType: "ADMIN" as const,
      recipientAdminId: id,
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
  regionCode?: string,
  sbuCode?: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    role: { in: roles },
    enabled: true,
  };

  if (regionCode) {
    if (sbuCode) {
      where.regions = { some: { regionCode, sbuCode } };
    } else {
      where.regions = { some: { regionCode } };
    }
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
