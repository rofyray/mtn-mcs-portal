import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";
import { generateToken, hashToken } from "@/lib/tokens";

const schema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      // Always return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    const { email } = result.data;

    // Look up user by email (must be verified)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (user && user.emailVerified) {
      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { identifier: email },
      });

      // Generate token and hash it
      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);

      // Create token with 1-hour expiry
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: {
          identifier: email,
          token: hashedToken,
          expires,
        },
      });

      // Build reset URL
      const resetUrl = `${requiredEnv.nextAuthUrl}/auth/reset-password?email=${encodeURIComponent(email)}&token=${rawToken}`;

      // Send email
      const { html, text } = buildEmailTemplate({
        title: "Reset Your Password",
        preheader: "Reset your MTN Community Shop password",
        message: [
          "We received a request to reset your password.",
          "Click the button below to set a new password. This link will expire in 1 hour.",
        ],
        cta: {
          label: "Reset Password",
          url: resetUrl,
        },
        footerNote:
          "If you did not request a password reset, you can safely ignore this email.",
      });

      await sendEmail({
        to: email,
        subject: "Reset Your Password - MTN Community Shop",
        html,
        text,
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  } catch {
    // Still return success to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
