import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { broadcastAdminNotification } from "@/lib/notifications";
import { getApprovedPartnerProfile } from "@/lib/partner";

const feedbackSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      partnerProfileId: result.profile.id,
      title: parsed.data.title,
      message: parsed.data.message,
    },
  });

  await broadcastAdminNotification({
    title: `Feedback: ${parsed.data.title}`,
    message: parsed.data.message,
    category: "INFO",
  });

  return NextResponse.json({ feedback });
}
