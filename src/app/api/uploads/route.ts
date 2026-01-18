import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import { getPartnerSession } from "@/lib/session";
import { getStorageProvider } from "@/lib/storage";

export async function POST(request: Request) {
  const [partnerSession, adminSession] = await Promise.all([
    getPartnerSession(),
    getAdminSession(),
  ]);

  if (!partnerSession?.user?.email && !adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const provider = getStorageProvider();
    const response = await provider.handleUpload(request);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
