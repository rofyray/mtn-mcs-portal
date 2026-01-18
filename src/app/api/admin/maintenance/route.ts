import { NextResponse } from "next/server";

import { runMaintenance } from "@/app/api/admin/reminders/route";
import { validateMaintenanceAuth } from "@/lib/maintenance";

export async function POST(request: Request) {
  if (!validateMaintenanceAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runMaintenance();
  return NextResponse.json(result);
}
