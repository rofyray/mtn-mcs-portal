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

  const trainingRequest = await prisma.trainingRequest.findUnique({
    where: { id },
  });

  if (!trainingRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (trainingRequest.partnerProfileId !== result.profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (trainingRequest.status === "CLOSED") {
    return NextResponse.json({ error: "Request thread is closed" }, { status: 400 });
  }

  const reply = await prisma.trainingRequestReply.create({
    data: {
      trainingRequestId: id,
      message: parsed.data.message,
      senderType: "PARTNER",
      senderPartnerId: result.profile.id,
    },
  });

  await prisma.trainingRequest.update({
    where: { id },
    data: { status: "OPEN" },
  });

  const regionCodes = await getPartnerRegionCodes(trainingRequest.partnerProfileId);
  await broadcastAdminNotification(
    {
      title: "Training request reply",
      message: `${result.profile.businessName ?? "Partner"} replied to a training request.`,
      category: "INFO",
    },
    undefined,
    regionCodes
  );

  return NextResponse.json({ reply });
}
