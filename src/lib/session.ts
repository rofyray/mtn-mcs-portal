import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export function getPartnerSession() {
  return getServerSession(authOptions);
}
