import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getApprovedPartnerProfile, getPartnerRegionCodes } from "@/lib/partner";
import { broadcastAdminNotification } from "@/lib/notifications";
import { AdminRole } from "@prisma/client";

function ghanaDisplayFilename(originalFilename: string): string {
  const now = new Date();
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = now.getUTCFullYear();
  let hours = now.getUTCHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  const ext = originalFilename.split(".").pop()?.toLowerCase() || "jpg";
  return `${dd}${mm}${yyyy}_${hh}${mi}${ss}_${ampm}_GMT.${ext}`;
}

export async function GET() {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  const paySlips = await prisma.paySlip.findMany({
    where: { partnerProfileId: result.profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    { paySlips },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}

export async function POST(request: Request) {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.imageUrl || !body?.originalFilename) {
    return NextResponse.json(
      { error: "imageUrl and originalFilename are required." },
      { status: 400 }
    );
  }

  const displayFilename = ghanaDisplayFilename(body.originalFilename);

  const paySlip = await prisma.paySlip.create({
    data: {
      partnerProfileId: result.profile.id,
      imageUrl: body.imageUrl,
      originalFilename: body.originalFilename,
      displayFilename,
    },
  });

  // Notify coordinators in partner's regions
  const regionCodes = await getPartnerRegionCodes(result.profile.id);
  const partnerName =
    [result.profile.partnerFirstName, result.profile.partnerSurname]
      .filter(Boolean)
      .join(" ") || "A partner";

  await broadcastAdminNotification(
    {
      title: "New pay slip uploaded",
      message: `${partnerName} uploaded a payment slip.`,
      category: "INFO",
    },
    [AdminRole.COORDINATOR],
    regionCodes
  );

  return NextResponse.json({ paySlip }, { status: 201 });
}
