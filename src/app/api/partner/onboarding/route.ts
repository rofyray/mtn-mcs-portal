import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { onboardingSchema } from "@/lib/onboarding";
import { getPartnerSession } from "@/lib/session";
import { formatZodError } from "@/lib/validation";

export async function GET() {
  const session = await getPartnerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await getPartnerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
  });

  if (existing && existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Profile locked" }, { status: 409 });
  }

  const profile = await prisma.partnerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...parsed.data,
    },
    update: {
      ...parsed.data,
    },
  });

  return NextResponse.json({ profile });
}
