import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { notifyAdminsByRole } from "@/lib/notifications";
import { ghanaLocations } from "@/lib/ghana-locations";
import { formatZodError } from "@/lib/validation";

const publicSchema = z.object({
  submitterName: z.string().min(1, "Your name is required"),
  submitterPhone: z.string().min(1, "Your phone number is required"),
  submitterEmail: z.string().email().optional().or(z.literal("")),
  businessName: z.string().min(1, "Business name is required"),
  regionCode: z.string().min(1, "Region is required"),
  sbuCode: z.string().optional(),
  dateOfIncorporation: z.string().optional(),
  businessType: z.string().optional(),
  businessTypeOther: z.string().optional(),
  registeredNature: z.string().optional(),
  registrationCertNo: z.string().optional(),
  mainOfficeLocation: z.string().optional(),
  tinNumber: z.string().optional(),
  postalAddress: z.string().optional(),
  physicalAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  digitalPostAddress: z.string().optional(),
  authorizedSignatory: z.any().optional(),
  contactPerson: z.any().optional(),
  pepDeclaration: z.any().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = publicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error), details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Validate regionCode
  if (!ghanaLocations[data.regionCode]) {
    return NextResponse.json(
      { error: "Invalid region code" },
      { status: 400 }
    );
  }

  const form = await prisma.onboardRequestForm.create({
    data: {
      status: "PENDING_COORDINATOR",
      createdByAdminId: null,
      regionCode: data.regionCode,
      sbuCode: data.sbuCode ?? null,
      businessName: data.businessName,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail || null,
      submitterPhone: data.submitterPhone,
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
      imageUrls: [],
    },
  });

  await logAuditEvent({
    adminId: null,
    action: "ONBOARD_REQUEST_PUBLIC_SUBMITTED",
    targetType: "OnboardRequestForm",
    targetId: form.id,
    metadata: {
      businessName: data.businessName,
      regionCode: data.regionCode,
      submitterName: data.submitterName,
    },
  });

  // Notify coordinators assigned to this region
  await notifyAdminsByRole(
    {
      title: "New Onboard Request Submission",
      message: `A new partner onboard request for "${data.businessName}" has been submitted and needs your review.`,
      category: "INFO",
    },
    ["COORDINATOR"],
    data.regionCode,
    data.sbuCode
  );

  return NextResponse.json(
    { message: "Your onboard request has been submitted successfully." },
    { status: 201 }
  );
}
