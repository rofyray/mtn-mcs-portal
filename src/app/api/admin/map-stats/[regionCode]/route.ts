import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { regionNames } from "@/lib/ghana-map-paths";

type Params = {
  params: Promise<{ regionCode: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { regionCode } = await params;
  const { admin, regionCodes } = adminContext;
  const isFullAccess = admin.role === "FULL";

  if (!isFullAccess && !regionCodes.includes(regionCode)) {
    return NextResponse.json(
      { error: "Access denied to this region" },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");

  const businesses = await prisma.business.findMany({
    where: {
      addressRegionCode: regionCode,
      status: "APPROVED",
      ...(search && {
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
                status: "APPROVED",
                OR: [
                  { firstName: { contains: search, mode: "insensitive" as const } },
                  { surname: { contains: search, mode: "insensitive" as const } },
                ],
              },
            },
          },
        ],
      }),
    },
    include: {
      partnerProfile: {
        select: {
          businessName: true,
          partnerFirstName: true,
          partnerSurname: true,
        },
      },
      agents: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          firstName: true,
          surname: true,
          phoneNumber: true,
          email: true,
          status: true,
        },
      },
    },
    orderBy: { businessName: "asc" },
  });

  const regionName = regionNames[regionCode] ?? regionCode;

  return NextResponse.json({
    regionCode,
    regionName,
    businesses: businesses.map((business) => ({
      id: business.id,
      businessName: business.businessName,
      city: business.city,
      district: business.addressDistrictCode,
      status: business.status,
      partnerName: business.partnerProfile.businessName ??
        `${business.partnerProfile.partnerFirstName ?? ""} ${business.partnerProfile.partnerSurname ?? ""}`.trim(),
      agentCount: business.agents.length,
      agents: business.agents,
    })),
    totalBusinesses: businesses.length,
    totalAgents: businesses.reduce((sum, b) => sum + b.agents.length, 0),
  });
}
