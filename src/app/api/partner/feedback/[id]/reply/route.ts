import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { broadcastAdminNotification } from "@/lib/notifications";
import { getApprovedPartnerProfile, getPartnerRegionCodes } from "@/lib/partner";

const replySchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  // Ownership check
  if (feedback.partnerProfileId !== result.profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (feedback.status === "CLOSED") {
    return NextResponse.json({ error: "Feedback thread is closed" }, { status: 400 });
  }

  const reply = await prisma.feedbackReply.create({
    data: {
      feedbackId: id,
      message: parsed.data.message,
      senderType: "PARTNER",
      senderPartnerId: result.profile.id,
    },
  });

  await prisma.feedback.update({
    where: { id },
    data: { status: "OPEN" },
  });

  const regionCodes = await getPartnerRegionCodes(feedback.partnerProfileId);
  await broadcastAdminNotification(
    {
      title: `Feedback reply: ${feedback.title}`,
      message: parsed.data.message,
      category: "INFO",
    },
    undefined,
    regionCodes
  );

  return NextResponse.json({ reply });
}
