import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const hashed = hashToken(token);

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email.toLowerCase(),
        token: hashed,
      },
    },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email.toLowerCase(),
        token: hashed,
      },
    },
  });

  return NextResponse.json({ status: "verified" });
}
