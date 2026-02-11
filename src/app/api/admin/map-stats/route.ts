import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { admin, regionCodes } = adminContext;
  const isFullAccess = admin.role === "FULL";
  const assignedRegions = isFullAccess ? Object.keys(regionNames) : regionCodes;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");

  // Build search filters for reuse
  const businessSearchFilter = search
    ? {
        OR: [
          { businessName: { contains: search, mode: "insensitive" as const } },
          {
            partnerProfile: {
              OR: [
                { businessName: { contains: search, mode: "insensitive" as const } },
                { partnerFirstName: { contains: search, mode: "insensitive" as const } },
                { partnerSurname: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
          {
            agents: {
              some: {
                status: "APPROVED" as const,
                OR: [
                  { firstName: { contains: search, mode: "insensitive" as const } },
                  { surname: { contains: search, mode: "insensitive" as const } },
                ],
              },
            },
          },
        ],
      }
    : {};

  const partnerSearchFilter = search
    ? {
        OR: [
          { businessName: { contains: search, mode: "insensitive" as const } },
          { partnerFirstName: { contains: search, mode: "insensitive" as const } },
          { partnerSurname: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Run aggregation queries in parallel
  const [businessCounts, agentCounts, partnerCounts] = await Promise.all([
    // Business counts by region
    prisma.business.groupBy({
      by: ["addressRegionCode"],
      _count: { id: true },
      where: {
        status: "APPROVED",
        addressRegionCode: { in: assignedRegions },
        ...businessSearchFilter,
      },
    }),
    // Agent counts by region (via business)
    prisma.agent.groupBy({
      by: ["businessId"],
      _count: { id: true },
      where: {
        status: "APPROVED",
        business: {
          status: "APPROVED",
          addressRegionCode: { in: assignedRegions },
          ...businessSearchFilter,
        },
      },
    }).then(async (agentsByBusiness) => {
      // Get business region codes for these agents
      const businessIds = agentsByBusiness.map((a) => a.businessId);
      if (businessIds.length === 0) return [];

      const businesses = await prisma.business.findMany({
        where: { id: { in: businessIds } },
        select: { id: true, addressRegionCode: true },
      });

      const businessRegionMap = new Map(businesses.map((b) => [b.id, b.addressRegionCode]));

      // Aggregate by region
      const regionAgentCounts: Record<string, number> = {};
      for (const item of agentsByBusiness) {
        const regionCode = businessRegionMap.get(item.businessId);
        if (regionCode) {
          regionAgentCounts[regionCode] = (regionAgentCounts[regionCode] || 0) + item._count.id;
        }
      }
      return Object.entries(regionAgentCounts).map(([regionCode, count]) => ({
        addressRegionCode: regionCode,
        _count: count,
      }));
    }),
    // Partner counts by region (direct from PartnerProfile)
    prisma.partnerProfile.groupBy({
      by: ["regionCode"],
      _count: { id: true },
      where: {
        status: "APPROVED",
        suspended: false,
        regionCode: { in: assignedRegions },
        ...partnerSearchFilter,
      },
    }),
  ]);

  // Build stats map
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

  // Populate business counts
  for (const item of businessCounts) {
    if (statsMap[item.addressRegionCode]) {
      statsMap[item.addressRegionCode].businessCount = item._count.id;
    }
  }

  // Populate agent counts
  for (const item of agentCounts) {
    if (statsMap[item.addressRegionCode]) {
      statsMap[item.addressRegionCode].agentCount = item._count;
    }
  }

  // Populate partner counts
  for (const item of partnerCounts) {
    if (item.regionCode && statsMap[item.regionCode]) {
      statsMap[item.regionCode].partnerCount = item._count.id;
    }
  }

  // When searching, filter out regions with 0 matches
  let stats = Object.values(statsMap);
  if (search) {
    stats = stats.filter(
      (s) => s.partnerCount > 0 || s.businessCount > 0 || s.agentCount > 0
    );
  }

  stats.sort((a, b) => a.regionName.localeCompare(b.regionName));

  return NextResponse.json({
    assignedRegions,
    stats,
    totalPartners: stats.reduce((sum, s) => sum + s.partnerCount, 0),
    totalBusinesses: stats.reduce((sum, s) => sum + s.businessCount, 0),
    totalAgents: stats.reduce((sum, s) => sum + s.agentCount, 0),
    isFiltered: !!search,
  });
}
