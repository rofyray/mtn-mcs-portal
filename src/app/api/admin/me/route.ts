import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    admin: {
      id: adminContext.admin.id,
      name: adminContext.admin.name,
      email: adminContext.admin.email,
      role: adminContext.admin.role,
      regions: adminContext.admin.regions.map((r) => ({
        regionCode: r.regionCode,
      })),
    },
  });
}
