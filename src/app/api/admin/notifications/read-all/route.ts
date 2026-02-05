import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function POST() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.notification.updateMany({
    where: {
      recipientType: "ADMIN",
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true, updatedCount: result.count });
}
