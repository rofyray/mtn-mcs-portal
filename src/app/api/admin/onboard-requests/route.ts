import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { logAuditEvent } from "@/lib/audit";
import { formatZodError } from "@/lib/validation";

const createSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  dateOfIncorporation: z.string().optional(),
  businessType: z.string().optional(),
  businessTypeOther: z.string().optional(),
  registeredNature: z.string().optional(),
  registrationCertNo: z.string().optional(),
  mainOfficeLocation: z.string().optional(),
  regionCode: z.string().min(1, "Region is required"),
  sbuCode: z.string().optional(),
  tinNumber: z.string().optional(),
  postalAddress: z.string().optional(),
  physicalAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  digitalPostAddress: z.string().optional(),
  authorizedSignatory: z.any().optional(),
  contactPerson: z.any().optional(),
  pepDeclaration: z.any().optional(),
  imageUrls: z.array(z.string()).max(5).optional(),
  completionDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.admin;
  const role = admin.role;
  const url = request.nextUrl;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  const statusFilter = url.searchParams.get("status");
  const regionFilter = url.searchParams.get("regionCode");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (regionFilter) {
    where.regionCode = regionFilter;
  }

  const regionCodes = admin.regions.map((r) => r.regionCode);

  switch (role) {
    case "COORDINATOR": {
      // Build SBU-aware region conditions
      const coordSbus = admin.regions.filter((r) => r.sbuCode);
      const sbuRegionCodes = coordSbus.map((s) => s.regionCode);
      const nonSbuRegions = admin.regions
        .filter((r) => !sbuRegionCodes.includes(r.regionCode))
        .map((r) => r.regionCode);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const regionConditions: any[] = [];
      if (nonSbuRegions.length > 0) {
        regionConditions.push({ regionCode: { in: nonSbuRegions } });
      }
      for (const s of coordSbus) {
        regionConditions.push({ regionCode: s.regionCode, sbuCode: s.sbuCode });
      }

      where.OR = [
        { createdByAdminId: admin.id },
        {
          status: "PENDING_COORDINATOR",
          ...(regionConditions.length === 1
            ? regionConditions[0]
            : { OR: regionConditions }),
        },
      ];
      break;
    }
    case "MANAGER":
      if (!statusFilter) {
        where.OR = [
          { status: "PENDING_MANAGER" },
          { approvals: { some: { adminId: admin.id } } },
        ];
      }
      break;
    case "SENIOR_MANAGER":
      if (!statusFilter) {
        where.OR = [
          { status: "PENDING_SENIOR_MANAGER", regionCode: { in: regionCodes } },
          { approvals: { some: { adminId: admin.id } } },
        ];
      } else {
        where.regionCode = { in: regionCodes };
      }
      break;
    case "GOVERNANCE":
      if (!statusFilter) {
        where.OR = [
          { status: "PENDING_GOVERNANCE_CHECK" },
          { approvals: { some: { adminId: admin.id } } },
        ];
      }
      break;
    case "FULL":
      // Full access — no additional restrictions
      break;
    default:
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [total, forms] = await Promise.all([
    prisma.onboardRequestForm.count({ where }),
    prisma.onboardRequestForm.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdByAdmin: { select: { id: true, name: true, role: true } },
      },
    }),
  ]);

  return NextResponse.json({
    forms,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.admin;
  if (admin.role !== "COORDINATOR") {
    return NextResponse.json(
      { error: "Only coordinators can create onboard requests" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error), details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Validate region belongs to coordinator
  const regionCodes = admin.regions.map((r) => r.regionCode);
  if (!regionCodes.includes(data.regionCode)) {
    return NextResponse.json(
      { error: "Region not in your assigned regions" },
      { status: 403 }
    );
  }

  const form = await prisma.onboardRequestForm.create({
    data: {
      status: "DRAFT",
      createdByAdminId: admin.id,
      regionCode: data.regionCode,
      sbuCode: data.sbuCode ?? null,
      businessName: data.businessName,
      dateOfIncorporation: data.dateOfIncorporation
        ? new Date(data.dateOfIncorporation)
        : null,
      businessType: data.businessType ?? null,
      businessTypeOther: data.businessTypeOther ?? null,
      registeredNature: data.registeredNature ?? null,
      registrationCertNo: data.registrationCertNo ?? null,
      mainOfficeLocation: data.mainOfficeLocation ?? null,
      tinNumber: data.tinNumber ?? null,
      postalAddress: data.postalAddress ?? null,
      physicalAddress: data.physicalAddress ?? null,
      companyPhone: data.companyPhone ?? null,
      digitalPostAddress: data.digitalPostAddress ?? null,
      authorizedSignatory: data.authorizedSignatory ?? undefined,
      contactPerson: data.contactPerson ?? undefined,
      pepDeclaration: data.pepDeclaration ?? undefined,
      imageUrls: data.imageUrls ?? [],
      completionDate: data.completionDate ? new Date(data.completionDate) : null,
    },
  });

  await logAuditEvent({
    adminId: admin.id,
    action: "ONBOARD_REQUEST_CREATED",
    targetType: "OnboardRequestForm",
    targetId: form.id,
    metadata: { businessName: data.businessName, regionCode: data.regionCode },
  });

  return NextResponse.json({ form }, { status: 201 });
}
