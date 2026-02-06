import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { logAuditEvent } from "@/lib/audit";
import { NotificationCategory } from "@prisma/client";
import { sendAdminNotification, notifyAdminsByRole } from "@/lib/notifications";

const submitSchema = z.object({
  comments: z.string().optional(),
  signatureUrl: z.string().optional(),
  signatureDate: z.string().optional(),
  legalScore: z.number().min(1).max(100).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.admin;
  const { id } = await context.params;

  const form = await prisma.dataRequestForm.findUnique({
    where: { id },
    include: {
      createdByAdmin: { select: { id: true, name: true } },
      approvals: {
        select: { adminId: true, role: true },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { comments, signatureUrl, signatureDate, legalScore } = parsed.data;
  const notificationTitle = `Data Request: ${form.businessName}`;

  let newStatus: string;
  let auditAction: string;
  let approvalAction: string;

  // State machine
  switch (form.status) {
    case "DRAFT": {
      // COORDINATOR submits to MANAGER
      if (admin.role !== "COORDINATOR" || form.createdByAdminId !== admin.id) {
        return NextResponse.json(
          { error: "Only the coordinator who created this can submit" },
          { status: 403 }
        );
      }
      newStatus = "PENDING_MANAGER";
      auditAction = "DATA_REQUEST_SUBMITTED_TO_MANAGER";
      approvalAction = "SUBMITTED";
      break;
    }
    case "PENDING_MANAGER": {
      if (admin.role !== "MANAGER" && admin.role !== "FULL") {
        return NextResponse.json(
          { error: "Only managers can approve at this stage" },
          { status: 403 }
        );
      }
      newStatus = "PENDING_SENIOR_MANAGER";
      auditAction = "DATA_REQUEST_SUBMITTED_TO_SENIOR_MANAGER";
      approvalAction = "APPROVED";
      break;
    }
    case "PENDING_SENIOR_MANAGER": {
      if (admin.role !== "SENIOR_MANAGER" && admin.role !== "FULL") {
        return NextResponse.json(
          { error: "Only senior managers can approve at this stage" },
          { status: 403 }
        );
      }
      // Validate senior manager has access to this region
      if (admin.role === "SENIOR_MANAGER") {
        const regionCodes = admin.regions.map((r) => r.regionCode);
        if (!regionCodes.includes(form.regionCode)) {
          return NextResponse.json(
            { error: "This form is not in your assigned region" },
            { status: 403 }
          );
        }
      }
      newStatus = "PENDING_LEGAL";
      auditAction = "DATA_REQUEST_SUBMITTED_TO_LEGAL";
      approvalAction = "APPROVED";
      break;
    }
    case "PENDING_LEGAL": {
      if (admin.role !== "LEGAL" && admin.role !== "FULL") {
        return NextResponse.json(
          { error: "Only legal can approve at this stage" },
          { status: 403 }
        );
      }
      if (legalScore === undefined) {
        return NextResponse.json(
          { error: "Legal score is required for final approval" },
          { status: 400 }
        );
      }
      newStatus = "APPROVED";
      auditAction = "DATA_REQUEST_APPROVED";
      approvalAction = "APPROVED";
      break;
    }
    default:
      return NextResponse.json(
        { error: `Cannot submit from status ${form.status}` },
        { status: 400 }
      );
  }

  // Update form status and create approval record
  const [updatedForm] = await Promise.all([
    prisma.dataRequestForm.update({
      where: { id },
      data: { status: newStatus as never },
    }),
    prisma.dataRequestApproval.create({
      data: {
        dataRequestFormId: id,
        adminId: admin.id,
        role: admin.role,
        action: approvalAction,
        comments: comments ?? null,
        signatureUrl: signatureUrl ?? null,
        signatureDate: signatureDate ? new Date(signatureDate) : null,
        legalScore: legalScore ?? null,
      },
    }),
  ]);

  // Audit log
  await logAuditEvent({
    adminId: admin.id,
    action: auditAction,
    targetType: "DataRequestForm",
    targetId: id,
    metadata: {
      businessName: form.businessName,
      from: form.status,
      to: newStatus,
      legalScore: legalScore ?? undefined,
    },
  });

  // Notifications
  const msg: { title: string; message: string; category: NotificationCategory } = {
    title: notificationTitle,
    message: "",
    category: "INFO",
  };

  switch (newStatus) {
    case "PENDING_MANAGER":
      msg.message = `A new data request for "${form.businessName}" has been submitted for your review.`;
      await notifyAdminsByRole(msg, ["MANAGER"]);
      break;
    case "PENDING_SENIOR_MANAGER":
      msg.message = `Data request for "${form.businessName}" has been approved by a manager and needs your review.`;
      await notifyAdminsByRole(msg, ["SENIOR_MANAGER"], form.regionCode);
      await sendAdminNotification(form.createdByAdminId, {
        ...msg,
        message: `Your data request for "${form.businessName}" has been approved by a manager.`,
        category: "SUCCESS",
      });
      break;
    case "PENDING_LEGAL":
      msg.message = `Data request for "${form.businessName}" has been approved by senior management and needs legal review.`;
      await notifyAdminsByRole(msg, ["LEGAL"]);
      await sendAdminNotification(form.createdByAdminId, {
        ...msg,
        message: `Your data request for "${form.businessName}" has been approved by senior management.`,
        category: "SUCCESS",
      });
      break;
    case "APPROVED":
      msg.message = `Data request for "${form.businessName}" has been fully approved by legal with a score of ${legalScore}%.`;
      msg.category = "SUCCESS";
      // Notify the coordinator
      await sendAdminNotification(form.createdByAdminId, msg);
      // Notify all previous approvers
      for (const approval of form.approvals) {
        if (approval.adminId !== admin.id && approval.adminId !== form.createdByAdminId) {
          await sendAdminNotification(approval.adminId, msg);
        }
      }
      break;
  }

  return NextResponse.json({ form: updatedForm });
}
