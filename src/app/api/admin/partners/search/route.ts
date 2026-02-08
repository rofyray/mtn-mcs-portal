import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminContext.admin.role !== "FULL") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ partners: [] });
  }

  const partners = await prisma.partnerProfile.findMany({
    where: {
      OR: [
        { businessName: { contains: q, mode: "insensitive" } },
        { partnerFirstName: { contains: q, mode: "insensitive" } },
        { partnerSurname: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    },
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
      user: {
        select: {
          email: true,
        },
      },
    },
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ partners });
}
