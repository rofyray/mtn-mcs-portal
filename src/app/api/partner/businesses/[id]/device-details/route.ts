import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getApprovedPartnerProfile } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

const deviceDetailsSchema = z
  .object({
    apn: z.string().trim().regex(/^\d+$/, "APN must contain only digits").optional(),
    mifiImei: z
      .string()
      .trim()
      .regex(/^\d+$/, "IMEI must contain only digits")
      .max(15, "IMEI must be at most 15 digits")
      .optional(),
  })
  .refine(
    (d) => d.apn || d.mifiImei,
    { message: "At least one field is required" }
  );

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getApprovedPartnerProfile();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = deviceDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const business = await prisma.business.findFirst({
    where: {
      id,
      partnerProfileId: result.profile.id,
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const data: Record<string, string> = {};
  if (parsed.data.apn) data.apn = parsed.data.apn;
  if (parsed.data.mifiImei) data.mifiImei = parsed.data.mifiImei;

  const updated = await prisma.business.update({
    where: { id: business.id },
    data,
  });

  return NextResponse.json({ business: updated });
}
