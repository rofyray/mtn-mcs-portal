import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { ghanaLocations } from "@/lib/ghana-locations";

const updateRegionsSchema = z.object({
  regionCodes: z.array(z.string()),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminContext.admin.role !== "FULL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const targetAdmin = await prisma.admin.findUnique({
    where: { id },
    include: { regions: { select: { regionCode: true } } },
  });

  if (!targetAdmin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // FULL admins have global access - no region assignments
  if (targetAdmin.role === "FULL") {
    return NextResponse.json(
      { error: "Full admins have global access and cannot be assigned regions" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = updateRegionsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { regionCodes } = parsed.data;

  // Validate region codes
  const validRegionCodes = Object.keys(ghanaLocations);
  const invalidCodes = regionCodes.filter((code) => !validRegionCodes.includes(code));
  if (invalidCodes.length > 0) {
    return NextResponse.json(
      { error: `Invalid region codes: ${invalidCodes.join(", ")}` },
      { status: 400 }
    );
  }

  const existingCodes = targetAdmin.regions.map((r) => r.regionCode);
  const codesToAdd = regionCodes.filter((code) => !existingCodes.includes(code));
  const codesToRemove = existingCodes.filter((code) => !regionCodes.includes(code));

  // Remove old assignments
  if (codesToRemove.length > 0) {
    await prisma.adminRegionAssignment.deleteMany({
      where: {
        adminId: id,
        regionCode: { in: codesToRemove },
      },
    });

    // Create audit logs for removals
    for (const code of codesToRemove) {
      await prisma.auditLog.create({
        data: {
          adminId: adminContext.admin.id,
          action: "ADMIN_REGION_REMOVED",
          targetType: "Admin",
          targetId: id,
          metadata: {
            targetName: targetAdmin.name,
            regionCode: code,
            regionName: ghanaLocations[code]?.name ?? code,
          },
        },
      });
    }
  }

  // Add new assignments
  if (codesToAdd.length > 0) {
    await prisma.adminRegionAssignment.createMany({
      data: codesToAdd.map((regionCode) => ({
        adminId: id,
        regionCode,
      })),
    });

    // Create audit logs for additions
    for (const code of codesToAdd) {
      await prisma.auditLog.create({
        data: {
          adminId: adminContext.admin.id,
          action: "ADMIN_REGION_ASSIGNED",
          targetType: "Admin",
          targetId: id,
          metadata: {
            targetName: targetAdmin.name,
            regionCode: code,
            regionName: ghanaLocations[code]?.name ?? code,
          },
        },
      });
    }
  }

  return NextResponse.json({ regionCodes });
}
