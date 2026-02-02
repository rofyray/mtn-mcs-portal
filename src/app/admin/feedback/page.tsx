"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminFeedbackEmptyIcon } from "@/components/admin-empty-icons";

type Feedback = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  partnerProfile: {
    businessName: string | null;
    partnerFirstName: string | null;
    partnerSurname: string | null;
    city: string | null;
  } | null;
};

export default function AdminFeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeedback() {
      const response = await fetch("/api/admin/feedback");
      if (!response.ok) {
        setError("Unable to load feedback.");
        return;
      }
      const data = await response.json();
      setFeedbackItems(data.feedback ?? []);
    }

    loadFeedback();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-semibold">Partner Feedback</h1>
          <p className="text-sm text-gray-600">Messages submitted by partners.</p>
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
            feedbackItems.map((item) => {
              const partnerName = item.partnerProfile
                ? [item.partnerProfile.partnerFirstName, item.partnerProfile.partnerSurname]
                    .filter(Boolean)
                    .join(" ") || item.partnerProfile.businessName
                : null;
              const location = item.partnerProfile?.city;

              return (
                <div key={item.id} className="rounded border p-3">
                  {(partnerName || location) && (
                    <div className="mb-1 text-xs text-gray-500">
                      {partnerName && <span className="font-medium">{partnerName}</span>}
                      {partnerName && location && <span> &middot; </span>}
                      {location && <span>{location}</span>}
                    </div>
                  )}
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="text-sm text-gray-700">{item.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
