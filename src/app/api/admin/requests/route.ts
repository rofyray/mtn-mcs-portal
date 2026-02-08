import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;
  const typeFilter = searchParams.get("type"); // "restock" | "training"
  const statusFilter = searchParams.get("status");

  const isCoordinator = adminContext.admin.role === "COORDINATOR";
  const regionCodes = adminContext.regionCodes;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restockWhere: any = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainingWhere: any = {};

  if (statusFilter && ["OPEN", "RESPONDED", "CLOSED"].includes(statusFilter)) {
    restockWhere.status = statusFilter;
    trainingWhere.status = statusFilter;
  }

  if (isCoordinator && regionCodes.length > 0) {
    restockWhere.business = { addressRegionCode: { in: regionCodes } };
    trainingWhere.partnerProfile = {
      businesses: { some: { addressRegionCode: { in: regionCodes } } },
    };
  }

  const fetchRestock = !typeFilter || typeFilter === "restock";
  const fetchTraining = !typeFilter || typeFilter === "training";

  const [restockRequests, trainingRequests] = await Promise.all([
    fetchRestock
      ? prisma.restockRequest.findMany({
          where: restockWhere,
          orderBy: { createdAt: "desc" },
          include: {
            partnerProfile: {
              select: {
                businessName: true,
                partnerFirstName: true,
                partnerSurname: true,
              },
            },
            business: {
              select: { businessName: true, city: true },
            },
            _count: { select: { replies: true } },
          },
          take: limit,
          skip,
        })
      : Promise.resolve([]),
    fetchTraining
      ? prisma.trainingRequest.findMany({
          where: trainingWhere,
          orderBy: { createdAt: "desc" },
          include: {
            partnerProfile: {
              select: {
                businessName: true,
                partnerFirstName: true,
                partnerSurname: true,
              },
            },
            _count: { select: { replies: true } },
          },
          take: limit,
          skip,
        })
      : Promise.resolve([]),
  ]);

  // Combine and sort
  const combined = [
    ...restockRequests.map((r) => ({ ...r, requestType: "restock" as const })),
    ...trainingRequests.map((r) => ({ ...r, requestType: "training" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const response = NextResponse.json({ requests: combined });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
  return response;
}
