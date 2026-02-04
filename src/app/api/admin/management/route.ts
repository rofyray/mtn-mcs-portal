import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

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
        select: { regionCode: true },
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
  }));

  return NextResponse.json({ admins: result });
}
