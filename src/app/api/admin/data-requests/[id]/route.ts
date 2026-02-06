import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

const updateSchema = z.object({
  businessName: z.string().min(1).optional(),
  dateOfIncorporation: z.string().optional(),
  businessType: z.string().optional(),
  businessTypeOther: z.string().optional(),
  registeredNature: z.string().optional(),
  registrationCertNo: z.string().optional(),
  mainOfficeLocation: z.string().optional(),
  regionCode: z.string().optional(),
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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const form = await prisma.dataRequestForm.findUnique({
    where: { id },
    include: {
      createdByAdmin: { select: { id: true, name: true, role: true } },
      approvals: {
        orderBy: { createdAt: "asc" },
        include: {
          admin: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ form });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.admin;
  const { id } = await context.params;

  const form = await prisma.dataRequestForm.findUnique({
    where: { id },
  });

  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (form.createdByAdminId !== admin.id) {
    return NextResponse.json(
      { error: "Only the creator can edit this form" },
      { status: 403 }
    );
  }

  if (form.status !== "DRAFT" && form.status !== "DENIED") {
    return NextResponse.json(
      { error: "Can only edit draft or denied forms" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // If region changed, validate it belongs to coordinator
  if (data.regionCode) {
    const regionCodes = admin.regions.map((r) => r.regionCode);
    if (!regionCodes.includes(data.regionCode)) {
      return NextResponse.json(
        { error: "Region not in your assigned regions" },
        { status: 403 }
      );
    }
  }

  // Build update data, only including provided fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (data.businessName !== undefined) updateData.businessName = data.businessName;
  if (data.dateOfIncorporation !== undefined)
    updateData.dateOfIncorporation = data.dateOfIncorporation
      ? new Date(data.dateOfIncorporation)
      : null;
  if (data.businessType !== undefined) updateData.businessType = data.businessType;
  if (data.businessTypeOther !== undefined) updateData.businessTypeOther = data.businessTypeOther;
  if (data.registeredNature !== undefined) updateData.registeredNature = data.registeredNature;
  if (data.registrationCertNo !== undefined) updateData.registrationCertNo = data.registrationCertNo;
  if (data.mainOfficeLocation !== undefined) updateData.mainOfficeLocation = data.mainOfficeLocation;
  if (data.regionCode !== undefined) updateData.regionCode = data.regionCode;
  if (data.tinNumber !== undefined) updateData.tinNumber = data.tinNumber;
  if (data.postalAddress !== undefined) updateData.postalAddress = data.postalAddress;
  if (data.physicalAddress !== undefined) updateData.physicalAddress = data.physicalAddress;
  if (data.companyPhone !== undefined) updateData.companyPhone = data.companyPhone;
  if (data.digitalPostAddress !== undefined) updateData.digitalPostAddress = data.digitalPostAddress;
  if (data.authorizedSignatory !== undefined) updateData.authorizedSignatory = data.authorizedSignatory;
  if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
  if (data.pepDeclaration !== undefined) updateData.pepDeclaration = data.pepDeclaration;
  if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;
  if (data.completionDate !== undefined)
    updateData.completionDate = data.completionDate
      ? new Date(data.completionDate)
      : null;

  // If editing a denied form, reset to DRAFT
  if (form.status === "DENIED") {
    updateData.status = "DRAFT";
  }

  const updated = await prisma.dataRequestForm.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ form: updated });
}
