import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { generateOtpCode } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/validation";

const requestSchema = z.object({
  email: z.string().email("A valid email is required"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const adminEmail = parsed.data.email.trim().toLowerCase();
  const admin = await prisma.admin.findFirst({
    where: { email: { equals: adminEmail, mode: "insensitive" } },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  if (!admin.enabled) {
    return NextResponse.json({ error: "Admin account is disabled" }, { status: 403 });
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

  await prisma.adminOtp.create({
    data: {
      adminId: admin.id,
      codeHash,
      expiresAt,
    },
  });

  const emailContent = buildEmailTemplate({
    title: "Your admin login code",
    preheader: "Use this one-time code to complete your sign-in.",
    message: "Use this one-time code to finish signing in. It expires in 10 minutes.",
    highlights: [{ label: "OTP code", value: code }],
    footerNote: "If you did not request this code, please ignore this email.",
  });

  await sendEmail({
    to: admin.email,
    subject: "Your admin login code",
    text: emailContent.text,
    html: emailContent.html,
  });

  return NextResponse.json({ status: "sent" });
}
