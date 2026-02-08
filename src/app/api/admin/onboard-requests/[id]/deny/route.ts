import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { logAuditEvent } from "@/lib/audit";
import { sendAdminNotification } from "@/lib/notifications";
import { formatZodError } from "@/lib/validation";

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

  // Only MANAGER, SENIOR_MANAGER, or GOVERNANCE can deny
  if (!["MANAGER", "SENIOR_MANAGER", "GOVERNANCE"].includes(admin.role)) {
    return NextResponse.json(
      { error: "You do not have permission to deny onboard requests" },
      { status: 403 }
    );
  }

  const form = await prisma.onboardRequestForm.findUnique({
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
    GOVERNANCE: ["PENDING_GOVERNANCE_CHECK"],
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
      { error: formatZodError(parsed.error), details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { comments, signatureUrl } = parsed.data;

  // Update status and create approval record
  const [updatedForm] = await Promise.all([
    prisma.onboardRequestForm.update({
      where: { id },
      data: { status: "DENIED" },
    }),
    prisma.onboardRequestApproval.create({
      data: {
        onboardRequestFormId: id,
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
    action: "ONBOARD_REQUEST_DENIED",
    targetType: "OnboardRequestForm",
    targetId: id,
    metadata: {
      businessName: form.businessName,
      previousStatus: form.status,
      reason: comments,
    },
  });

  // Notify the coordinator
  const notif = {
    title: `Onboard Request Denied: ${form.businessName}`,
    message: `Your onboard request for "${form.businessName}" has been denied. Reason: ${comments}`,
    category: "WARNING" as const,
  };

  if (form.createdByAdminId) {
    await sendAdminNotification(form.createdByAdminId, notif);
  }

  // Notify all previous approvers
  const notified = new Set([admin.id, ...(form.createdByAdminId ? [form.createdByAdminId] : [])]);
  for (const approval of form.approvals) {
    if (!notified.has(approval.adminId)) {
      notified.add(approval.adminId);
      await sendAdminNotification(approval.adminId, {
        title: notif.title,
        message: `Onboard request for "${form.businessName}" has been denied.`,
        category: "WARNING",
      });
    }
  }

  return NextResponse.json({ form: updatedForm });
}
