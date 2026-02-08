import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AdminRole } from "@prisma/client";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { ghanaLocations } from "@/lib/ghana-locations";
import { logAuditEvent } from "@/lib/audit";
import { sendAdminNotification } from "@/lib/notifications";

export async function GET() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminContext.admin.role !== "FULL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      enabled: true,
      regions: {
        select: { regionCode: true, sbuCode: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    enabled: admin.enabled,
    regionCodes: admin.regions.map((r) => r.regionCode),
    sbuAssignments: Object.fromEntries(
      admin.regions.filter((r) => r.sbuCode).map((r) => [r.regionCode, r.sbuCode!])
    ),
  }));

  return NextResponse.json({ admins: result });
}

const createAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  role: z.nativeEnum(AdminRole),
  regionCodes: z.array(z.string()).optional().default([]),
  sbuAssignments: z.record(z.string(), z.string()).optional().default({}),
});

export async function POST(request: NextRequest) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminContext.admin.role !== "FULL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, role, regionCodes, sbuAssignments } = parsed.data;

  // FULL and MANAGER have global access — no regions
  if ((role === "FULL" || role === "MANAGER") && regionCodes.length > 0) {
    return NextResponse.json(
      { error: "Full Access and Manager admins have global access and cannot be assigned regions" },
      { status: 400 }
    );
  }

  // Validate region codes
  for (const code of regionCodes) {
    if (!ghanaLocations[code]) {
      return NextResponse.json(
        { error: `Invalid region code: ${code}` },
        { status: 400 }
      );
    }
  }

  try {
    const newAdmin = await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          name,
          email,
          role,
          enabled: true,
        },
      });

      if (regionCodes.length > 0) {
        await tx.adminRegionAssignment.createMany({
          data: regionCodes.map((regionCode) => ({
            adminId: admin.id,
            regionCode,
            sbuCode: sbuAssignments[regionCode] || null,
          })),
        });
      }

      return admin;
    });

    await logAuditEvent({
      adminId: adminContext.admin.id,
      action: "ADMIN_CREATED",
      targetType: "Admin",
      targetId: newAdmin.id,
      metadata: { name, email, role, regionCodes },
    });

    await sendAdminNotification(newAdmin.id, {
      title: "Welcome to MCS Portal",
      message: `Your ${role.replace("_", " ").toLowerCase()} admin account has been created. You can now log in using OTP.`,
      category: "SUCCESS",
    });

    return NextResponse.json({
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        enabled: newAdmin.enabled,
        regionCodes,
        sbuAssignments,
      },
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
