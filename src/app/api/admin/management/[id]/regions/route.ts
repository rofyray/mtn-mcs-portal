import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { ghanaLocations } from "@/lib/ghana-locations";
import { formatZodError } from "@/lib/validation";

const updateRegionsSchema = z.object({
  regionCodes: z.array(z.string(), { error: "Region codes are required" }),
  sbuAssignments: z.record(z.string(), z.string()).optional(),
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
    include: { regions: { select: { regionCode: true, sbuCode: true } } },
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
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { regionCodes, sbuAssignments } = parsed.data;

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

    // Create audit logs for removals (batched)
    await prisma.auditLog.createMany({
      data: codesToRemove.map((code) => ({
        adminId: adminContext.admin.id,
        action: "ADMIN_REGION_REMOVED" as const,
        targetType: "Admin",
        targetId: id,
        metadata: {
          targetName: targetAdmin.name,
          regionCode: code,
          regionName: ghanaLocations[code]?.name ?? code,
        },
      })),
    });
  }

  // Add new assignments
  if (codesToAdd.length > 0) {
    await prisma.adminRegionAssignment.createMany({
      data: codesToAdd.map((regionCode) => ({
        adminId: id,
        regionCode,
        sbuCode: sbuAssignments?.[regionCode] ?? null,
      })),
    });

    // Create audit logs for additions (batched)
    await prisma.auditLog.createMany({
      data: codesToAdd.map((code) => ({
        adminId: adminContext.admin.id,
        action: "ADMIN_REGION_ASSIGNED" as const,
        targetType: "Admin",
        targetId: id,
        metadata: {
          targetName: targetAdmin.name,
          regionCode: code,
          regionName: ghanaLocations[code]?.name ?? code,
        },
      })),
    });
  }

  // Update SBU assignments for existing regions that weren't removed
  if (sbuAssignments) {
    const keptCodes = regionCodes.filter((code) => !codesToAdd.includes(code));
    for (const code of keptCodes) {
      const newSbu = sbuAssignments[code] ?? null;
      const existing = targetAdmin.regions.find((r) => r.regionCode === code);
      if (existing && (existing.sbuCode ?? null) !== newSbu) {
        await prisma.adminRegionAssignment.updateMany({
          where: { adminId: id, regionCode: code },
          data: { sbuCode: newSbu },
        });
      }
    }
  }

  return NextResponse.json({ regionCodes, sbuAssignments: sbuAssignments ?? {} });
}
