import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getPartnerSession } from "@/lib/session";

const requiredFields = [
  "businessName",
  "partnerFirstName",
  "partnerSurname",
  "phoneNumber",
  "paymentWallet",
  "ghanaCardNumber",
  "ghanaCardFrontUrl",
  "ghanaCardBackUrl",
  "passportPhotoUrl",
  "taxIdentityNumber",
  "businessCertificateUrl",
  "fireCertificateUrl",
  "insuranceUrl",
  "apn",
  "mifiImei",
];

export async function POST() {
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

  if (!profile) {
    return NextResponse.json({ error: "Profile missing" }, { status: 404 });
  }

  if (profile.status !== "DRAFT") {
    return NextResponse.json({ error: "Profile locked" }, { status: 409 });
  }

  const missing = requiredFields.filter((field) => !profile[field as keyof typeof profile]);

  if (missing.length) {
    return NextResponse.json(
      { error: "Missing required fields", missing },
      { status: 400 }
    );
  }

  const updated = await prisma.partnerProfile.update({
    where: { userId: user.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ profile: updated });
}
