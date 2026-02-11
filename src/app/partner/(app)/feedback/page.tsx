"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { FeedbackCard, type FeedbackItem } from "@/components/feedback-card";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";

const FeedbackEmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h6" />
  </svg>
);

export default function PartnerFeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

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

  async function submitFeedback() {
    setError(null);
    setStatus(null);

    const response = await fetch("/api/partner/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: feedbackTitle, message: feedbackMessage }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to send feedback.");
      notify({ title: "Feedback failed", message: data.error ?? "Unable to send feedback.", kind: "error" });
      return;
    }

    setStatus("Feedback sent.");
    notify({ title: "Feedback sent", message: "Thanks for sharing your input.", kind: "success" });
    setFeedbackTitle("");
    setFeedbackMessage("");
    setRefreshKey((k) => k + 1);
  }

  function handleReplySubmitted() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Feedback</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Send feedback or view past submissions and admin responses.
          </p>
        </div>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Send Feedback</h2>
          <input
            className="input"
            placeholder="Title"
            value={feedbackTitle}
            onChange={(event) => setFeedbackTitle(event.target.value)}
          />
          <textarea
            className="input"
            rows={4}
            placeholder="Message"
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
          />
          <button className="btn btn-primary" type="button" onClick={submitFeedback}>
            Send feedback
          </button>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {status ? <p className="form-message form-message-success">{status}</p> : null}

        <div className="space-y-3">
          {feedbackItems.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<FeedbackEmptyIcon />}
                title="No feedback yet"
                description="Feedback you submit will appear here."
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
