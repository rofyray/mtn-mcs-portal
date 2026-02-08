"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminFeedbackEmptyIcon } from "@/components/admin-empty-icons";
import { FeedbackCard, type FeedbackItem } from "@/components/feedback-card";

const STATUS_FILTERS = ["ALL", "OPEN", "RESPONDED", "CLOSED"] as const;

export default function AdminFeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback() {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (cancelled) return;
      if (!response.ok) {
        setError("Unable to load feedback.");
        return;
      }
      const data = await response.json();
      if (!cancelled) {
        setFeedbackItems(data.feedback ?? []);
      }
    }

    loadFeedback();
    return () => { cancelled = true; };
  }, [statusFilter, refreshKey]);

  function handleReplySubmitted() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-semibold">Partner Feedback</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Messages submitted by partners.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`btn ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {feedbackItems.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<AdminFeedbackEmptyIcon />}
                title="No feedback yet"
                description="Partner messages will show up here."
                variant="inset"
              />
            </div>
          ) : (
            feedbackItems.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                viewerType="ADMIN"
                onReplySubmitted={handleReplySubmitted}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
