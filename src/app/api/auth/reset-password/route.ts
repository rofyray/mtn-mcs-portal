import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { hashToken } from "@/lib/tokens";

const schema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, token, password } = result.data;

    // Hash the provided token to compare with stored hash
    const hashedToken = hashToken(token);

    // Find matching token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: hashedToken,
          },
        },
      });

      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user's password
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: hashedToken,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
