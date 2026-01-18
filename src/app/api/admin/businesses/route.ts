import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { admin, regionCodes } = adminContext;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  if (admin.role !== "FULL") {
    where.addressRegionCode = { in: regionCodes };
  }

  const businesses = await prisma.business.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ businesses, adminRole: admin.role });
}
