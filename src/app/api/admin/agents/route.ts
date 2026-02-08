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
    const sbuAssignments = admin.regions.filter((r) => r.sbuCode);
    const sbuRegionCodes = sbuAssignments.map((s) => s.regionCode);
    const nonSbuRegions = regionCodes.filter((rc) => !sbuRegionCodes.includes(rc));

    if (sbuAssignments.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];
      if (nonSbuRegions.length > 0) {
        conditions.push({ addressRegionCode: { in: nonSbuRegions } });
      }
      for (const s of sbuAssignments) {
        conditions.push({ addressRegionCode: s.regionCode, addressSbuCode: s.sbuCode });
      }
      where.business = { OR: conditions };
    } else {
      where.business = { addressRegionCode: { in: regionCodes } };
    }
  }

  const agents = await prisma.agent.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      surname: true,
      phoneNumber: true,
      email: true,
      status: true,
      businessName: true,
      business: {
        select: {
          city: true,
          addressCode: true,
          addressRegionCode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const response = NextResponse.json({ agents, adminRole: admin.role });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return response;
}
