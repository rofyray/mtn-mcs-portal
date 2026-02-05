import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.notification.count({
    where: {
      recipientType: "ADMIN",
      recipientAdminId: adminContext.admin.id,
      readAt: null,
    },
  });

  return NextResponse.json({ count });
}
