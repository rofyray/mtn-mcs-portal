import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAuditEvent } from "@/lib/audit";
import { generateCsv, formatDate } from "@/lib/csv";
import { ghanaLocations } from "@/lib/ghana-locations";

const ALLOWED_TYPES = [
  "partners",
  "agents",
  "locations",
  "location-coordinates",
  "training-requests",
  "restock-requests",
  "feedback",
] as const;

type ReportType = (typeof ALLOWED_TYPES)[number];

function regionName(code: string | null | undefined): string {
  if (!code) return "";
  return ghanaLocations[code]?.name ?? code;
}

function districtName(regionCode: string | null | undefined, districtCode: string | null | undefined): string {
  if (!regionCode || !districtCode) return "";
  const region = ghanaLocations[regionCode];
  if (!region) return districtCode;
  const district = region.districts.find((d) => d.code === districtCode);
  return district?.name ?? districtCode;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { admin } = session;
  if (!["FULL", "MANAGER"].includes(admin.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") as ReportType | null;
  const region = searchParams.get("region") || undefined;
  const status = searchParams.get("status") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const partnerSearch = searchParams.get("partnerSearch") || undefined;
  const onlyWithCoords = searchParams.get("onlyWithCoords") === "true";

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return Response.json({ error: "Invalid report type" }, { status: 400 });
  }

  const MANAGER_ALLOWED_TYPES: ReportType[] = ["partners", "agents"];
  if (admin.role === "MANAGER" && !MANAGER_ALLOWED_TYPES.includes(type)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  // Default to APPROVED for entity reports; "ALL" explicitly means no status filter
  const entityTypes = ["partners", "agents", "locations", "location-coordinates"];
  const effectiveStatus =
    status === "ALL" ? undefined : status || (entityTypes.includes(type) ? "APPROVED" : undefined);

  let headers: string[] = [];
  let rows: string[][] = [];

  try {
    switch (type) {
      case "partners": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (effectiveStatus) where.status = effectiveStatus;
        if (partnerSearch) {
          where.OR = [
            { businessName: { contains: partnerSearch, mode: "insensitive" } },
            { partnerFirstName: { contains: partnerSearch, mode: "insensitive" } },
            { partnerSurname: { contains: partnerSearch, mode: "insensitive" } },
          ];
        }

        const partners = await prisma.partnerProfile.findMany({
          where,
          include: { user: { select: { email: true } } },
          orderBy: { createdAt: "desc" },
        });

        headers = [
          "Business Name", "First Name", "Surname", "Email", "Phone",
          "Payment Wallet", "Ghana Card #", "TIN", "Region",
          "Status", "Submitted", "Approved", "Denied",
        ];
        rows = partners.map((p) => [
          p.businessName ?? "",
          p.partnerFirstName ?? "",
          p.partnerSurname ?? "",
          p.user.email ?? "",
          p.phoneNumber ?? "",
          p.paymentWallet ?? "",
          p.ghanaCardNumber ?? "",
          p.taxIdentityNumber ?? "",
          regionName(p.regionCode),
          p.status,
          formatDate(p.submittedAt),
          formatDate(p.approvedAt),
          formatDate(p.deniedAt),
        ]);
        break;
      }

      case "agents": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (effectiveStatus) where.status = effectiveStatus;
        if (region) where.business = { addressRegionCode: region };
        if (partnerSearch) {
          where.partnerProfile = {
            OR: [
              { businessName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerFirstName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerSurname: { contains: partnerSearch, mode: "insensitive" } },
            ],
          };
        }

        const agents = await prisma.agent.findMany({
          where,
          include: {
            business: { select: { addressRegionCode: true, city: true } },
            partnerProfile: { select: { businessName: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        headers = [
          "First Name", "Surname", "Phone", "Email", "CP App #",
          "Agent Username", "Minerva Code", "Ghana Card #", "Business Name",
          "Region", "City", "Partner", "Status", "Submitted", "Approved", "Denied",
        ];
        rows = agents.map((a) => [
          a.firstName,
          a.surname,
          a.phoneNumber,
          a.email,
          a.cpAppNumber ?? "",
          a.agentUsername ?? "",
          a.minervaReferralCode ?? "",
          a.ghanaCardNumber,
          a.businessName,
          regionName(a.business.addressRegionCode),
          a.business.city ?? "",
          a.partnerProfile.businessName ?? "",
          a.status,
          formatDate(a.submittedAt),
          formatDate(a.approvedAt),
          formatDate(a.deniedAt),
        ]);
        break;
      }

      case "locations": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (effectiveStatus) where.status = effectiveStatus;
        if (region) where.addressRegionCode = region;
        if (partnerSearch) {
          where.partnerProfile = {
            OR: [
              { businessName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerFirstName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerSurname: { contains: partnerSearch, mode: "insensitive" } },
            ],
          };
        }

        const locations = await prisma.business.findMany({
          where,
          include: {
            partnerProfile: { select: { businessName: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        headers = [
          "Business Name", "Region", "District", "City", "Landmark",
          "Latitude", "Longitude", "APN", "MiFi IMEI", "Partner", "Status", "Submitted", "Approved", "Denied",
        ];
        rows = locations.map((b) => [
          b.businessName,
          regionName(b.addressRegionCode),
          districtName(b.addressRegionCode, b.addressDistrictCode),
          b.city,
          b.landmark ?? "",
          b.gpsLatitude ?? "",
          b.gpsLongitude ?? "",
          b.apn ?? "",
          b.mifiImei ?? "",
          b.partnerProfile.businessName ?? "",
          b.status,
          formatDate(b.submittedAt),
          formatDate(b.approvedAt),
          formatDate(b.deniedAt),
        ]);
        break;
      }

      case "location-coordinates": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (effectiveStatus) where.status = effectiveStatus;
        if (region) where.addressRegionCode = region;
        if (onlyWithCoords) {
          where.gpsLatitude = { not: "" };
          where.gpsLongitude = { not: "" };
        }
        if (partnerSearch) {
          where.partnerProfile = {
            OR: [
              { businessName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerFirstName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerSurname: { contains: partnerSearch, mode: "insensitive" } },
            ],
          };
        }

        const coords = await prisma.business.findMany({
          where,
          orderBy: { createdAt: "desc" },
        });

        headers = ["Business Name", "Latitude", "Longitude"];
        rows = coords.map((b) => [
          b.businessName,
          b.gpsLatitude ?? "",
          b.gpsLongitude ?? "",
        ]);
        break;
      }

      case "training-requests": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (effectiveStatus) where.status = effectiveStatus;
        if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
        if (region) {
          where.partnerProfile = {
            businesses: { some: { addressRegionCode: region } },
          };
        }
        if (partnerSearch) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const partnerWhere: any = where.partnerProfile ?? {};
          partnerWhere.OR = [
            { businessName: { contains: partnerSearch, mode: "insensitive" } },
            { partnerFirstName: { contains: partnerSearch, mode: "insensitive" } },
            { partnerSurname: { contains: partnerSearch, mode: "insensitive" } },
          ];
          where.partnerProfile = partnerWhere;
        }

        const trainings = await prisma.trainingRequest.findMany({
          where,
          include: {
            partnerProfile: {
              select: { businessName: true, partnerFirstName: true, partnerSurname: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        headers = ["Partner", "Agent Names", "Message", "Status", "Created"];
        rows = trainings.map((t) => [
          [t.partnerProfile.partnerFirstName, t.partnerProfile.partnerSurname].filter(Boolean).join(" "),
          t.agentNames.join(", "),
          t.message ?? "",
          t.status,
          formatDate(t.createdAt),
        ]);
        break;
      }

      case "restock-requests": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (effectiveStatus) where.status = effectiveStatus;
        if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
        if (region) where.business = { addressRegionCode: region };
        if (partnerSearch) {
          where.partnerProfile = {
            OR: [
              { businessName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerFirstName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerSurname: { contains: partnerSearch, mode: "insensitive" } },
            ],
          };
        }

        const restocks = await prisma.restockRequest.findMany({
          where,
          include: {
            partnerProfile: {
              select: { businessName: true, partnerFirstName: true, partnerSurname: true },
            },
            business: { select: { businessName: true, city: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        headers = ["Partner", "Business", "City", "Items", "Message", "Status", "Created"];
        rows = restocks.map((r) => [
          [r.partnerProfile.partnerFirstName, r.partnerProfile.partnerSurname].filter(Boolean).join(" "),
          r.business.businessName,
          r.business.city ?? "",
          r.items.join(", "),
          r.message ?? "",
          r.status,
          formatDate(r.createdAt),
        ]);
        break;
      }

      case "feedback": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (effectiveStatus) where.status = effectiveStatus;
        if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
        if (partnerSearch) {
          where.partnerProfile = {
            OR: [
              { businessName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerFirstName: { contains: partnerSearch, mode: "insensitive" } },
              { partnerSurname: { contains: partnerSearch, mode: "insensitive" } },
            ],
          };
        }

        const feedbackItems = await prisma.feedback.findMany({
          where,
          include: {
            partnerProfile: {
              select: { partnerFirstName: true, partnerSurname: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        headers = ["Partner", "Title", "Message", "Status", "Created"];
        rows = feedbackItems.map((f) => [
          [f.partnerProfile.partnerFirstName, f.partnerProfile.partnerSurname].filter(Boolean).join(" "),
          f.title,
          f.message,
          f.status,
          formatDate(f.createdAt),
        ]);
        break;
      }
    }

    const csv = generateCsv(headers, rows);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `${type}-report-${today}.csv`;

    // Audit log (fire-and-forget)
    logAuditEvent({
      adminId: admin.id,
      action: "REPORT_GENERATED",
      targetType: "Report",
      targetId: type,
      metadata: {
        reportType: type,
        rowCount: rows.length,
        ...(region ? { region } : {}),
        ...(status ? { status } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        ...(partnerSearch ? { partnerSearch } : {}),
        ...(onlyWithCoords ? { onlyWithCoords } : {}),
      },
    }).catch(() => {});

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
