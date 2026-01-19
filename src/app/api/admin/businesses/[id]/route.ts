import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { businessUpdateSchema } from "@/lib/business";
import { getAdminAndBusiness } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndBusiness(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const body = await request.json();
  const parsed = businessUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.business.update({
    where: { id },
    data: parsed.data,
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: "BUSINESS_EDITED",
    targetType: "Business",
    targetId: id,
    metadata: { updatedFields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ business: updated });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndBusiness(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  return NextResponse.json({ business: access.business, adminRole: access.admin.role });
}
