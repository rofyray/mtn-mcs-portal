import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getApprovedPartnerProfile } from "@/lib/partner";

export async function GET() {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const [restockRequests, trainingRequests] = await Promise.all([
    prisma.restockRequest.findMany({
      where: { partnerProfileId: result.profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: { businessName: true, city: true },
        },
        replies: {
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { replies: true } },
      },
    }),
    prisma.trainingRequest.findMany({
      where: { partnerProfileId: result.profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { replies: true } },
      },
    }),
  ]);

  const requests = [
    ...restockRequests.map((r) => ({ ...r, requestType: "restock" as const })),
    ...trainingRequests.map((r) => ({ ...r, requestType: "training" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const response = NextResponse.json({ requests });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return response;
}
