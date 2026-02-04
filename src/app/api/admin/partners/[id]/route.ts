import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getAdminAndProfile } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { onboardingSchema } from "@/lib/onboarding";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndProfile(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const body = await request.json();
  const parsed = onboardingSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.partnerProfile.update({
    where: { id },
    data: parsed.data,
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: "PARTNER_EDITED",
    targetType: "PartnerProfile",
    targetId: id,
    metadata: { updatedFields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ profile: updated });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndProfile(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  return NextResponse.json({ profile: access.profile, adminRole: access.admin.role });
}
