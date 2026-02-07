import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAuditEvent } from "@/lib/audit";
import { formatZodError } from "@/lib/validation";

const sendSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  partnerIds: z.array(z.string().min(1)).min(1, "At least one partner must be selected"),
  documentUrl: z.string().url("Document is required"),
});

export async function POST(request: Request) {
  const adminContext = await requireAdmin();
  if (!adminContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { title, partnerIds, documentUrl } = parsed.data;

  const partnerProfiles = await prisma.partnerProfile.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, userId: true, businessName: true },
  });

  const forms = await prisma.$transaction(
    partnerProfiles.map((profile) =>
      prisma.formRequest.create({
        data: {
          partnerProfileId: profile.id,
          title,
          documentUrl,
        },
      })
    )
  );

  for (const form of forms) {
    await logAuditEvent({
      adminId: adminContext.admin.id,
      action: "FORM_SENT",
      targetType: "FormRequest",
      targetId: form.id,
      metadata: { title, partnerProfileId: form.partnerProfileId },
    });
  }

  await prisma.$transaction(
    partnerProfiles.map((profile) =>
      prisma.notification.create({
        data: {
          recipientType: "PARTNER",
          recipientUserId: profile.userId,
          title: "Form request",
          message: `${title} sent to ${profile.businessName ?? "your account"}.`,
          category: "INFO",
        },
      })
    )
  );

  return NextResponse.json({ forms });
}
