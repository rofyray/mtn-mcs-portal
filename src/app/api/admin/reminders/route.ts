import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { REJECTION_EXPIRY_DAYS, REJECTION_REMINDER_DAYS } from "@/lib/expiry";
import { sendEmail } from "@/lib/email";
import { buildEmailTemplate } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";
import { logAuditEvent } from "@/lib/audit";
import { validateMaintenanceAuth } from "@/lib/maintenance";

export async function runMaintenance() {
  const now = new Date();

  const deniedPartners = await prisma.partnerProfile.findMany({
    where: {
      status: "DENIED",
      deniedAt: { not: null },
    },
  });
  const deniedAgents = await prisma.agent.findMany({
    where: {
      status: "DENIED",
      deniedAt: { not: null },
    },
  });
  const deniedBusinesses = await prisma.business.findMany({
    where: {
      status: "DENIED",
      deniedAt: { not: null },
    },
  });

  const reminders: string[] = [];

  for (const partner of deniedPartners) {
    if (!partner.deniedAt) continue;

    const daysSince = Math.floor((now.getTime() - partner.deniedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (REJECTION_REMINDER_DAYS.includes(daysSince)) {
      reminders.push(`${partner.businessName ?? "Partner"} denied ${daysSince} days ago.`);
    }

    if (daysSince >= REJECTION_EXPIRY_DAYS) {
      await prisma.partnerProfile.update({
        where: { id: partner.id },
        data: { status: "EXPIRED" },
      });
      await logAuditEvent({
        adminId: null,
        action: "PARTNER_EXPIRED",
        targetType: "PartnerProfile",
        targetId: partner.id,
        metadata: { reason: "Auto-expired after 30 days denied." },
      });
    }
  }

  for (const agent of deniedAgents) {
    if (!agent.deniedAt) continue;

    const daysSince = Math.floor((now.getTime() - agent.deniedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (REJECTION_REMINDER_DAYS.includes(daysSince)) {
      reminders.push(`Agent ${agent.firstName} ${agent.surname} denied ${daysSince} days ago.`);
    }

    if (daysSince >= REJECTION_EXPIRY_DAYS) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { status: "EXPIRED" },
      });
      await logAuditEvent({
        adminId: null,
        action: "AGENT_EXPIRED",
        targetType: "Agent",
        targetId: agent.id,
        metadata: { reason: "Auto-expired after 30 days denied." },
      });
    }
  }

  for (const business of deniedBusinesses) {
    if (!business.deniedAt) continue;

    const daysSince = Math.floor((now.getTime() - business.deniedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (REJECTION_REMINDER_DAYS.includes(daysSince)) {
      reminders.push(`Location ${business.businessName} denied ${daysSince} days ago.`);
    }

    if (daysSince >= REJECTION_EXPIRY_DAYS) {
      await prisma.business.update({
        where: { id: business.id },
        data: { status: "EXPIRED" },
      });
      await logAuditEvent({
        adminId: null,
        action: "BUSINESS_EXPIRED",
        targetType: "Business",
        targetId: business.id,
        metadata: { reason: "Auto-expired after 30 days denied." },
      });
    }
  }

  if (reminders.length) {
    const email = buildEmailTemplate({
      title: "Denied submissions nearing expiry",
      preheader: "Denied submissions are approaching the expiry window.",
      message: "Follow up on these submissions before they expire.",
      bullets: reminders,
    });

    await sendEmail({
      to: requiredEnv.smtpDefaultRecipient,
      subject: "Pending denied submission follow-ups",
      text: email.text,
      html: email.html,
    });
  }

  return { remindersSent: reminders.length };
}

export async function POST(request: Request) {
  if (!validateMaintenanceAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runMaintenance();
  return NextResponse.json(result);
}
