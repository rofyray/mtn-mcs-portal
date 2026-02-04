import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type TargetDetails = {
  name: string;
  email?: string;
  location?: { regionCode: string; city?: string };
  linkedPartner?: { id: string; name: string };
  signerName?: string;
};

export async function GET() {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminContext.admin.role !== "FULL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      admin: {
        select: {
          name: true,
          email: true,
          role: true,
          regions: { select: { regionCode: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Group target IDs by type for batch fetching
  const partnerIds = new Set<string>();
  const agentIds = new Set<string>();
  const businessIds = new Set<string>();
  const formRequestIds = new Set<string>();

  for (const log of logs) {
    switch (log.targetType) {
      case "PartnerProfile":
        partnerIds.add(log.targetId);
        break;
      case "Agent":
        agentIds.add(log.targetId);
        break;
      case "Business":
        businessIds.add(log.targetId);
        break;
      case "FormRequest":
        formRequestIds.add(log.targetId);
        break;
    }
  }

  // Batch fetch all target entities
  const [partners, agents, businesses, formRequests] = await Promise.all([
    partnerIds.size > 0
      ? prisma.partnerProfile.findMany({
          where: { id: { in: [...partnerIds] } },
          select: {
            id: true,
            businessName: true,
            partnerFirstName: true,
            partnerSurname: true,
            user: { select: { email: true } },
          },
        })
      : [],
    agentIds.size > 0
      ? prisma.agent.findMany({
          where: { id: { in: [...agentIds] } },
          select: {
            id: true,
            firstName: true,
            surname: true,
            businessName: true,
            business: { select: { addressRegionCode: true, city: true } },
            partnerProfile: { select: { id: true, businessName: true } },
          },
        })
      : [],
    businessIds.size > 0
      ? prisma.business.findMany({
          where: { id: { in: [...businessIds] } },
          select: {
            id: true,
            businessName: true,
            addressRegionCode: true,
            city: true,
            partnerProfile: { select: { id: true, businessName: true } },
          },
        })
      : [],
    formRequestIds.size > 0
      ? prisma.formRequest.findMany({
          where: { id: { in: [...formRequestIds] } },
          select: {
            id: true,
            title: true,
            status: true,
            partnerProfile: { select: { id: true, businessName: true } },
            signature: { select: { signerName: true } },
          },
        })
      : [],
  ]);

  // Create maps for O(1) lookup
  const partnerMap = new Map(partners.map((p) => [p.id, p]));
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const businessMap = new Map(businesses.map((b) => [b.id, b]));
  const formRequestMap = new Map(formRequests.map((f) => [f.id, f]));

  // Enrich logs with target details
  const enrichedLogs = logs.map((log) => {
    let targetDetails: TargetDetails | null = null;

    switch (log.targetType) {
      case "PartnerProfile": {
        const partner = partnerMap.get(log.targetId);
        if (partner) {
          const fullName = [partner.partnerFirstName, partner.partnerSurname]
            .filter(Boolean)
            .join(" ");
          targetDetails = {
            name: partner.businessName || fullName || "Unknown Partner",
            email: partner.user?.email ?? undefined,
          };
        }
        break;
      }
      case "Agent": {
        const agent = agentMap.get(log.targetId);
        if (agent) {
          targetDetails = {
            name: `${agent.firstName} ${agent.surname}`.trim() || "Unknown Agent",
            location: agent.business
              ? {
                  regionCode: agent.business.addressRegionCode,
                  city: agent.business.city,
                }
              : undefined,
            linkedPartner: agent.partnerProfile
              ? {
                  id: agent.partnerProfile.id,
                  name: agent.partnerProfile.businessName || "Partner",
                }
              : undefined,
          };
        }
        break;
      }
      case "Business": {
        const business = businessMap.get(log.targetId);
        if (business) {
          targetDetails = {
            name: business.businessName || "Unknown Business",
            location: {
              regionCode: business.addressRegionCode,
              city: business.city,
            },
            linkedPartner: business.partnerProfile
              ? {
                  id: business.partnerProfile.id,
                  name: business.partnerProfile.businessName || "Partner",
                }
              : undefined,
          };
        }
        break;
      }
      case "FormRequest": {
        const formRequest = formRequestMap.get(log.targetId);
        if (formRequest) {
          targetDetails = {
            name: formRequest.title || "Form Request",
            linkedPartner: formRequest.partnerProfile
              ? {
                  id: formRequest.partnerProfile.id,
                  name: formRequest.partnerProfile.businessName || "Partner",
                }
              : undefined,
            signerName: formRequest.signature?.signerName ?? undefined,
          };
        }
        break;
      }
    }

    return {
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata,
      admin: log.admin
        ? {
            name: log.admin.name,
            email: log.admin.email,
            role: log.admin.role,
            regionCodes: log.admin.regions.map((r) => r.regionCode),
          }
        : null,
      targetDetails,
    };
  });

  return NextResponse.json({ logs: enrichedLogs });
}
