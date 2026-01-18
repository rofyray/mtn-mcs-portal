import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";
import { generateToken, hashToken } from "@/lib/tokens";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email: rawEmail, password } = parsed.data;
  const normalizedEmail = rawEmail.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
  });

  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: hashedToken,
      expires,
    },
  });

  const verifyUrl = new URL("/auth/verify", requiredEnv.nextAuthUrl);
  verifyUrl.searchParams.set("token", rawToken);
  verifyUrl.searchParams.set("email", normalizedEmail);

  const emailContent = buildEmailTemplate({
    title: "Verify your account",
    preheader: "Confirm your email to activate your account.",
    message: [
      "Thanks for joining MTN Community Shop.",
      "Confirm your email to activate your account and start onboarding.",
    ],
    cta: { label: "Verify account", url: verifyUrl.toString() },
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your MTN Community Shop account",
    text: emailContent.text,
    html: emailContent.html,
  });

  return NextResponse.json({ id: user.id });
}
