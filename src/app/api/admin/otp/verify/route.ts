import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/db";
import { generateSessionToken, hashSessionToken } from "@/lib/admin-auth";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, code } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const admin = await prisma.admin.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  });
  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const otp = await prisma.adminOtp.findFirst({
    where: {
      adminId: admin.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "No valid OTP" }, { status: 400 });
  }

  const valid = await bcrypt.compare(code, otp.codeHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  await prisma.adminOtp.update({
    where: { id: otp.id },
    data: { status: "USED" },
  });

  const sessionToken = generateSessionToken();
  const hashedToken = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);

  await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      sessionToken: hashedToken,
      expiresAt,
    },
  });

  const response = NextResponse.json({ status: "verified", role: admin.role });
  response.cookies.set("admin_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return response;
}
