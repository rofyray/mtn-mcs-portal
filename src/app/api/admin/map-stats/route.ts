import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { regionNames } from "@/lib/ghana-map-paths";

export type RegionStats = {
  regionCode: string;
  regionName: string;
  partnerCount: number;
  businessCount: number;
  agentCount: number;
};

export async function GET() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { admin, regionCodes } = adminContext;
  const isFullAccess = admin.role === "FULL";
  const assignedRegions = isFullAccess ? Object.keys(regionNames) : regionCodes;

  const businesses = await prisma.business.findMany({
    where: {
      status: "APPROVED",
      addressRegionCode: { in: assignedRegions },
    },
    select: {
      addressRegionCode: true,
      partnerProfileId: true,
      _count: {
        select: { agents: { where: { status: "APPROVED" } } },
      },
    },
  });

  const statsMap: Record<string, RegionStats> = {};

  for (const code of assignedRegions) {
    statsMap[code] = {
      regionCode: code,
      regionName: regionNames[code] ?? code,
      partnerCount: 0,
      businessCount: 0,
      agentCount: 0,
    };
  }

  const partnersByRegion: Record<string, Set<string>> = {};
  for (const code of assignedRegions) {
    partnersByRegion[code] = new Set();
  }

  for (const business of businesses) {
    const code = business.addressRegionCode;
    if (!statsMap[code]) continue;

    statsMap[code].businessCount += 1;
    statsMap[code].agentCount += business._count.agents;
    partnersByRegion[code].add(business.partnerProfileId);
  }

  for (const code of assignedRegions) {
    statsMap[code].partnerCount = partnersByRegion[code].size;
  }

  const stats = Object.values(statsMap).sort((a, b) =>
    a.regionName.localeCompare(b.regionName)
  );

  const totals = stats.reduce(
    (acc, region) => {
      acc.totalPartners += region.partnerCount;
      acc.totalBusinesses += region.businessCount;
      acc.totalAgents += region.agentCount;
      return acc;
    },
    { totalPartners: 0, totalBusinesses: 0, totalAgents: 0 }
  );

  return NextResponse.json({
    assignedRegions,
    stats,
    ...totals,
  });
}
