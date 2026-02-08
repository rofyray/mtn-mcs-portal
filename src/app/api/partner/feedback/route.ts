import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { broadcastAdminNotification } from "@/lib/notifications";
import { getApprovedPartnerProfile, getPartnerRegionCodes } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

const feedbackSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  message: z.string().trim().min(1, "Message is required"),
});

export async function GET() {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const feedback = await prisma.feedback.findMany({
    where: { partnerProfileId: result.profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  const response = NextResponse.json({ feedback });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return response;
}

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
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      partnerProfileId: result.profile.id,
      title: parsed.data.title,
      message: parsed.data.message,
    },
  });

  const regionCodes = await getPartnerRegionCodes(result.profile.id);
  await broadcastAdminNotification(
    {
      title: `Feedback: ${parsed.data.title}`,
      message: parsed.data.message,
      category: "INFO",
    },
    undefined,
    regionCodes
  );

  return NextResponse.json({ feedback });
}
