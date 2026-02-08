import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { admin } = adminContext;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  // Partners no longer have direct location - all admins can view all partners
  // Region filtering now applies at the agent/business level

  const partners = await prisma.partnerProfile.findMany({
    where,
    select: {
      id: true,
      userId: true,
      status: true,
      suspended: true,
      suspendedAt: true,
      businessName: true,
      partnerFirstName: true,
      partnerSurname: true,
      phoneNumber: true,
      submittedAt: true,
      approvedAt: true,
      deniedAt: true,
      denialReason: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const response = NextResponse.json({ partners, adminRole: admin.role });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return response;
}
