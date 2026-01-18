import { cookies } from "next/headers";

import prisma from "@/lib/db";
import { hashSessionToken } from "@/lib/admin-auth";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) {
    return null;
  }

  const hashed = hashSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { sessionToken: hashed },
    include: { admin: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}
