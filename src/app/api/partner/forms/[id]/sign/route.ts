import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { broadcastAdminNotification } from "@/lib/notifications";
import { getApprovedPartnerProfile, getPartnerRegionCodes } from "@/lib/partner";
import { formatZodError } from "@/lib/validation";

const signSchema = z.object({
  signerName: z.string().trim().min(1, "Signer name is required"),
  signatureUrl: z.string().url("Signature is required"),
});

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

  const formRequest = await prisma.formRequest.findUnique({
    where: { id },
  });

  if (!formRequest || formRequest.partnerProfileId !== result.profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (formRequest.status !== "SENT") {
    return NextResponse.json({ error: "Form already signed" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const signature = await prisma.formSignature.create({
    data: {
      formRequestId: formRequest.id,
      signerName: parsed.data.signerName,
      signatureUrl: parsed.data.signatureUrl,
    },
  });

  await prisma.formRequest.update({
    where: { id: formRequest.id },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
    },
  });

  const regionCodes = await getPartnerRegionCodes(result.profile.id);
  await broadcastAdminNotification(
    {
      title: "Form signed",
      message: `${parsed.data.signerName} signed "${formRequest.title}".`,
      category: "SUCCESS",
    },
    undefined,
    regionCodes
  );

  await logAuditEvent({
    action: "FORM_SIGNED",
    targetType: "FormRequest",
    targetId: formRequest.id,
    metadata: { signerName: parsed.data.signerName },
  });

  return NextResponse.json({ signature });
}
