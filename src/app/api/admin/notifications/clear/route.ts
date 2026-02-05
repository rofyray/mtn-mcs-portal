import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function DELETE() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.notification.deleteMany({
    where: {
      recipientType: "ADMIN",
      recipientAdminId: adminContext.admin.id,
    },
  });

  return NextResponse.json({ success: true, deletedCount: result.count });
}
