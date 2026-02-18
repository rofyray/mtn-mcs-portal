import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { broadcastAdminNotification, getCoordinatorEmailsForRegions } from "@/lib/notifications";
import { buildEmailTemplate } from "@/lib/email-template";
import { getApprovedPartnerProfile } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

const itemOptions = ["SIM Cards", "Y'ello Biz", "Y'ello Cameras"] as const;

const restockSchema = z.object({
  businessId: z.string().min(1, "Business location is required"),
  items: z.array(z.enum(itemOptions)).min(1, "At least one item is required"),
  simQuantity: z.number().int().min(1, "SIM card quantity must be at least 1").optional(),
  message: z.string().trim().optional(),
}).refine(
  (data) => !data.items.includes("SIM Cards") || (data.simQuantity != null && data.simQuantity >= 1),
  { message: "SIM card quantity is required when SIM Cards is selected", path: ["simQuantity"] }
);

export async function POST(request: Request) {
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = restockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const business = await prisma.business.findFirst({
    where: {
      id: parsed.data.businessId,
      partnerProfileId: result.profile.id,
      status: "APPROVED",
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found or not approved" }, { status: 400 });
  }

  const requestRecord = await prisma.restockRequest.create({
    data: {
      partnerProfileId: result.profile.id,
      businessId: parsed.data.businessId,
      items: parsed.data.items,
      simQuantity: parsed.data.simQuantity ?? null,
      message: parsed.data.message,
    },
  });

  const locationInfo = `${business.businessName} (${business.city})`;
  const simQtyLabel = parsed.data.simQuantity ? ` (qty: ${parsed.data.simQuantity})` : "";
  const itemsLabel = parsed.data.items.map(i => i === "SIM Cards" ? `SIM Cards${simQtyLabel}` : i).join(", ");

  await broadcastAdminNotification(
    {
      title: "Restock request",
      message: `${result.profile.businessName ?? "Partner"} requested restock for ${locationInfo}: ${itemsLabel}.`,
      category: "INFO",
    },
    undefined,
    [business.addressRegionCode]
  );

  const coordinatorEmails = await getCoordinatorEmailsForRegions([business.addressRegionCode]);
  if (coordinatorEmails.length > 0) {
    const email = buildEmailTemplate({
      title: "New restock request",
      preheader: "A partner submitted a restock request.",
      message: [
        `Partner: ${result.profile.businessName ?? "Unknown"}`,
        `Location: ${locationInfo}`,
        parsed.data.message ? `Message: ${parsed.data.message}` : "Message: -",
      ],
      bullets: parsed.data.items.length ? [`Items: ${itemsLabel}`] : undefined,
    });
    await sendEmail({
      to: coordinatorEmails.join(","),
      subject: "Partner restock request",
      text: email.text,
      html: email.html,
    });
  }

  return NextResponse.json({ request: requestRecord });
}
