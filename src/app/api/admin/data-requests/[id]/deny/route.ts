import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { logAuditEvent } from "@/lib/audit";
import { sendAdminNotification } from "@/lib/notifications";

const denySchema = z.object({
  comments: z.string().min(1, "Comments are required when denying"),
  signatureUrl: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.admin;
  const { id } = await context.params;

  // Only MANAGER, SENIOR_MANAGER, LEGAL, or FULL can deny
  if (!["MANAGER", "SENIOR_MANAGER", "LEGAL", "FULL"].includes(admin.role)) {
    return NextResponse.json(
      { error: "You do not have permission to deny data requests" },
      { status: 403 }
    );
  }

  const form = await prisma.dataRequestForm.findUnique({
    where: { id },
    include: {
      createdByAdmin: { select: { id: true, name: true } },
      approvals: {
        select: { adminId: true },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Validate the status allows denial from this role
  const allowedStatuses: Record<string, string[]> = {
    MANAGER: ["PENDING_MANAGER"],
    SENIOR_MANAGER: ["PENDING_SENIOR_MANAGER"],
    LEGAL: ["PENDING_LEGAL"],
    FULL: ["PENDING_MANAGER", "PENDING_SENIOR_MANAGER", "PENDING_LEGAL"],
  };

  const allowed = allowedStatuses[admin.role] ?? [];
  if (!allowed.includes(form.status)) {
    return NextResponse.json(
      { error: `Cannot deny form in ${form.status} status with your role` },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = denySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { comments, signatureUrl } = parsed.data;

  // Update status and create approval record
  const [updatedForm] = await Promise.all([
    prisma.dataRequestForm.update({
      where: { id },
      data: { status: "DENIED" },
    }),
    prisma.dataRequestApproval.create({
      data: {
        dataRequestFormId: id,
        adminId: admin.id,
        role: admin.role,
        action: "DENIED",
        comments,
        signatureUrl: signatureUrl ?? null,
      },
    }),
  ]);

  await logAuditEvent({
    adminId: admin.id,
    action: "DATA_REQUEST_DENIED",
    targetType: "DataRequestForm",
    targetId: id,
    metadata: {
      businessName: form.businessName,
      previousStatus: form.status,
      reason: comments,
    },
  });

  // Notify the coordinator
  const notif = {
    title: `Data Request Denied: ${form.businessName}`,
    message: `Your data request for "${form.businessName}" has been denied. Reason: ${comments}`,
    category: "WARNING" as const,
  };

  await sendAdminNotification(form.createdByAdminId, notif);

  // Notify all previous approvers
  const notified = new Set([admin.id, form.createdByAdminId]);
  for (const approval of form.approvals) {
    if (!notified.has(approval.adminId)) {
      notified.add(approval.adminId);
      await sendAdminNotification(approval.adminId, {
        title: notif.title,
        message: `Data request for "${form.businessName}" has been denied.`,
        category: "WARNING",
      });
    }
  }

  return NextResponse.json({ form: updatedForm });
}
