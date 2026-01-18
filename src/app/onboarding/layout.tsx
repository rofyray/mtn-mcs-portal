import { redirect } from "next/navigation";

import { getPartnerSession } from "@/lib/session";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPartnerSession();

  if (!session?.user?.email) {
    redirect("/partner/login");
  }

  return children;
}
