import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function GET() {
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ admins });
}
