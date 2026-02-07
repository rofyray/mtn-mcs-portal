import Link from "next/link";

import PostAuthToast from "@/components/post-auth-toast";

import prisma from "@/lib/db";
import { getPartnerSession } from "@/lib/session";

export default async function PartnerDashboardPage() {
  const session = await getPartnerSession();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { partnerProfile: { select: { id: true } } },
  });

  const profileId = user?.partnerProfile?.id;
  if (!profileId) {
    return null;
  }

  const [
    agentsTotal,
    agentsApproved,
    agentsDenied,
    agentsSubmitted,
    businessesTotal,
    businessesApproved,
    businessesDenied,
    businessesSubmitted,
    formsTotal,
    formsSigned,
    formsRejected,
    formsSent,
    trainingRequests,
    restockRequests,
    feedbackItems,
  ] = await Promise.all([
    prisma.agent.count({ where: { partnerProfileId: profileId } }),
    prisma.agent.count({ where: { partnerProfileId: profileId, status: "APPROVED" } }),
    prisma.agent.count({ where: { partnerProfileId: profileId, status: "DENIED" } }),
    prisma.agent.count({ where: { partnerProfileId: profileId, status: "SUBMITTED" } }),
    prisma.business.count({ where: { partnerProfileId: profileId } }),
    prisma.business.count({ where: { partnerProfileId: profileId, status: "APPROVED" } }),
    prisma.business.count({ where: { partnerProfileId: profileId, status: "DENIED" } }),
    prisma.business.count({ where: { partnerProfileId: profileId, status: "SUBMITTED" } }),
    prisma.formRequest.count({ where: { partnerProfileId: profileId } }),
    prisma.formRequest.count({ where: { partnerProfileId: profileId, status: "SIGNED" } }),
    prisma.formRequest.count({ where: { partnerProfileId: profileId, status: "REJECTED" } }),
    prisma.formRequest.count({ where: { partnerProfileId: profileId, status: "SENT" } }),
    prisma.trainingRequest.count({ where: { partnerProfileId: profileId } }),
    prisma.restockRequest.count({ where: { partnerProfileId: profileId } }),
    prisma.feedback.count({ where: { partnerProfileId: profileId } }),
  ]);

  return (
    <main className="min-h-screen px-6 py-10">
      <PostAuthToast />
      <div className="mx-auto w-full max-w-5xl space-y-8 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Partner Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Overview of your onboarding progress and requests.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Agents</p>
            <p className="text-2xl font-semibold">{agentsTotal}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {agentsApproved} approved • {agentsSubmitted} pending • {agentsDenied} denied
            </p>
          </div>
          <div className="card space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Locations</p>
            <p className="text-2xl font-semibold">{businessesTotal}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {businessesApproved} approved • {businessesSubmitted} pending • {businessesDenied} denied
            </p>
          </div>
          <div className="card space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Forms</p>
            <p className="text-2xl font-semibold">{formsTotal}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formsSigned} signed • {formsSent} pending • {formsRejected} rejected
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Requests</p>
            <p className="text-2xl font-semibold">{trainingRequests + restockRequests}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {trainingRequests} training • {restockRequests} restock
            </p>
          </div>
          <div className="card space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Feedback</p>
            <p className="text-2xl font-semibold">{feedbackItems}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Messages submitted to admins.</p>
          </div>
          <div className="card space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-secondary" href="/partner/agents">
                Add Agent
              </Link>
              <Link className="btn btn-secondary" href="/partner/businesses">
                Add Location
              </Link>
              <Link className="btn btn-secondary" href="/partner/requests">
                New Request
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
