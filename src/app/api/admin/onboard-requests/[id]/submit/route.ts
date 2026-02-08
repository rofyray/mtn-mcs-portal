import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { logAuditEvent } from "@/lib/audit";
import { NotificationCategory } from "@prisma/client";
import { sendAdminNotification, notifyAdminsByRole } from "@/lib/notifications";
import { formatZodError } from "@/lib/validation";

const submitSchema = z.object({
  comments: z.string().optional(),
  signatureUrl: z.string().optional(),
  signatureDate: z.string().optional(),
  governanceScore: z.number().min(1).max(100).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = session.admin;
  const { id } = await context.params;

  const form = await prisma.onboardRequestForm.findUnique({
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
      { error: formatZodError(parsed.error), details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { comments, signatureUrl, signatureDate, governanceScore } = parsed.data;
  const notificationTitle = `Onboard Request: ${form.businessName}`;

  let newStatus: string;
  let auditAction: string;
  let approvalAction: string;

  // State machine
  switch (form.status) {
    case "PENDING_COORDINATOR": {
      // COORDINATOR submits public form to MANAGER
      if (admin.role !== "COORDINATOR") {
        return NextResponse.json(
          { error: "Only coordinators can submit at this stage" },
          { status: 403 }
        );
      }
      const coordRegions = admin.regions.map((r) => r.regionCode);
      if (!coordRegions.includes(form.regionCode)) {
        return NextResponse.json(
          { error: "This form is not in your assigned region" },
          { status: 403 }
        );
      }
      newStatus = "PENDING_MANAGER";
      auditAction = "ONBOARD_REQUEST_SUBMITTED_TO_MANAGER";
      approvalAction = "SUBMITTED";
      break;
    }
    case "DRAFT": {
      // COORDINATOR submits to MANAGER
      if (admin.role !== "COORDINATOR" || form.createdByAdminId !== admin.id) {
        return NextResponse.json(
          { error: "Only the coordinator who created this can submit" },
          { status: 403 }
        );
      }
      newStatus = "PENDING_MANAGER";
      auditAction = "ONBOARD_REQUEST_SUBMITTED_TO_MANAGER";
      approvalAction = "SUBMITTED";
      break;
    }
    case "PENDING_MANAGER": {
      if (admin.role !== "MANAGER") {
        return NextResponse.json(
          { error: "Only managers can approve at this stage" },
          { status: 403 }
        );
      }
      newStatus = "PENDING_SENIOR_MANAGER";
      auditAction = "ONBOARD_REQUEST_SUBMITTED_TO_SENIOR_MANAGER";
      approvalAction = "APPROVED";
      break;
    }
    case "PENDING_SENIOR_MANAGER": {
      if (admin.role !== "SENIOR_MANAGER") {
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
      newStatus = "PENDING_GOVERNANCE_CHECK";
      auditAction = "ONBOARD_REQUEST_SUBMITTED_TO_GOVERNANCE";
      approvalAction = "APPROVED";
      break;
    }
    case "PENDING_GOVERNANCE_CHECK": {
      if (admin.role !== "GOVERNANCE") {
        return NextResponse.json(
          { error: "Only governance check admins can approve at this stage" },
          { status: 403 }
        );
      }
      if (governanceScore === undefined) {
        return NextResponse.json(
          { error: "Governance score is required for final approval" },
          { status: 400 }
        );
      }
      newStatus = "APPROVED";
      auditAction = "ONBOARD_REQUEST_APPROVED";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formUpdateData: any = { status: newStatus as never };
  // Claim the form when transitioning from PENDING_COORDINATOR
  if (form.status === "PENDING_COORDINATOR" && !form.createdByAdminId) {
    formUpdateData.createdByAdminId = admin.id;
  }

  const [updatedForm] = await Promise.all([
    prisma.onboardRequestForm.update({
      where: { id },
      data: formUpdateData,
    }),
    prisma.onboardRequestApproval.create({
      data: {
        onboardRequestFormId: id,
        adminId: admin.id,
        role: admin.role,
        action: approvalAction,
        comments: comments ?? null,
        signatureUrl: signatureUrl ?? null,
        signatureDate: signatureDate ? new Date(signatureDate) : null,
        governanceScore: governanceScore ?? null,
      },
    }),
  ]);

  // Audit log
  await logAuditEvent({
    adminId: admin.id,
    action: auditAction,
    targetType: "OnboardRequestForm",
    targetId: id,
    metadata: {
      businessName: form.businessName,
      from: form.status,
      to: newStatus,
      governanceScore: governanceScore ?? undefined,
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
      msg.message = `A new onboard request for "${form.businessName}" has been submitted for your review.`;
      await notifyAdminsByRole(msg, ["MANAGER"]);
      break;
    case "PENDING_SENIOR_MANAGER":
      msg.message = `Onboard request for "${form.businessName}" has been approved by a manager and needs your review.`;
      await notifyAdminsByRole(msg, ["SENIOR_MANAGER"], form.regionCode);
      if (form.createdByAdminId) {
        await sendAdminNotification(form.createdByAdminId, {
          ...msg,
          message: `Your onboard request for "${form.businessName}" has been approved by a manager.`,
          category: "SUCCESS",
        });
      }
      break;
    case "PENDING_GOVERNANCE_CHECK":
      msg.message = `Onboard request for "${form.businessName}" has been approved by senior management and needs governance review.`;
      await notifyAdminsByRole(msg, ["GOVERNANCE"]);
      if (form.createdByAdminId) {
        await sendAdminNotification(form.createdByAdminId, {
          ...msg,
          message: `Your onboard request for "${form.businessName}" has been approved by senior management.`,
          category: "SUCCESS",
        });
      }
      break;
    case "APPROVED":
      msg.message = `Onboard request for "${form.businessName}" has been fully approved after governance check with a score of ${governanceScore}%.`;
      msg.category = "SUCCESS";
      // Notify the coordinator
      if (form.createdByAdminId) {
        await sendAdminNotification(form.createdByAdminId, msg);
      }
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
