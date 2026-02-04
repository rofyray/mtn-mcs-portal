import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      partnerProfile: {
        select: {
          businessName: true,
          partnerFirstName: true,
          partnerSurname: true,
        },
      },
    },
  });

  return NextResponse.json({ feedback });
}
