import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function POST(
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
  const targetAdmin = await prisma.admin.findUnique({ where: { id } });

  if (!targetAdmin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Cannot disable yourself
  if (targetAdmin.id === adminContext.admin.id) {
    return NextResponse.json(
      { error: "Cannot disable your own account" },
      { status: 400 }
    );
  }

  // If disabling, ensure at least one FULL admin remains enabled
  if (targetAdmin.enabled && targetAdmin.role === "FULL") {
    const enabledFullAdmins = await prisma.admin.count({
      where: { role: "FULL", enabled: true },
    });

    if (enabledFullAdmins <= 1) {
      return NextResponse.json(
        { error: "Cannot disable the last enabled full admin" },
        { status: 400 }
      );
    }
  }

  const newEnabled = !targetAdmin.enabled;

  await prisma.admin.update({
    where: { id },
    data: { enabled: newEnabled },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      adminId: adminContext.admin.id,
      action: newEnabled ? "ADMIN_ENABLED" : "ADMIN_DISABLED",
      targetType: "Admin",
      targetId: id,
      metadata: {
        targetName: targetAdmin.name,
        targetEmail: targetAdmin.email,
        targetRole: targetAdmin.role,
      },
    },
  });

  return NextResponse.json({ enabled: newEnabled });
}
