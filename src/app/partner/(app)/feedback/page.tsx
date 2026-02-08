"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { FeedbackCard, type FeedbackItem } from "@/components/feedback-card";

const FeedbackEmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h6" />
  </svg>
);

export default function PartnerFeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadFeedback() {
      const response = await fetch("/api/partner/feedback");
      if (!response.ok) {
        setError("Unable to load feedback.");
        return;
      }
      const data = await response.json();
      setFeedbackItems(
        (data.feedback ?? []).map((f: FeedbackItem & { partnerProfile?: unknown }) => ({
          ...f,
          partnerProfile: f.partnerProfile ?? null,
        }))
      );
    }

    loadFeedback();
  }, [refreshKey]);

  function handleReplySubmitted() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">My Feedback</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View your submitted feedback and admin responses.
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {feedbackItems.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<FeedbackEmptyIcon />}
                title="No feedback yet"
                description="Feedback you submit from the Requests page will appear here."
                variant="inset"
              />
            </div>
          ) : (
            feedbackItems.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                viewerType="PARTNER"
                onReplySubmitted={handleReplySubmitted}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
