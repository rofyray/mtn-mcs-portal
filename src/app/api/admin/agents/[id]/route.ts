import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { agentUpdateSchema } from "@/lib/agent";
import { getAdminAndAgent } from "@/lib/admin-access";
import { logAuditEvent } from "@/lib/audit";
import { formatZodError } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndAgent(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  const body = await request.json();
  const parsed = agentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: parsed.data,
  });

  await logAuditEvent({
    adminId: access.admin.id,
    action: "AGENT_EDITED",
    targetType: "Agent",
    targetId: id,
    metadata: { updatedFields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ agent: updated });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getAdminAndAgent(id);

  if ("error" in access) {
    const status = access.error === "unauthorized" ? 401 : access.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: access.error }, { status });
  }

  return NextResponse.json({ agent: access.agent, adminRole: access.admin.role });
}
