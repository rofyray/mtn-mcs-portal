"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { RequestCard, type RequestItem } from "@/components/request-card";

const TYPE_FILTERS = ["all", "restock", "training"] as const;
const STATUS_FILTERS = ["ALL", "OPEN", "RESPONDED", "CLOSED"] as const;

function RequestsEmptyIcon() {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3h6l3 3v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 12h6M9 16h6M9 8h2" />
    </svg>
  );
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const response = await fetch(`/api/admin/requests?${params.toString()}`);
      if (cancelled) return;
      if (!response.ok) {
        setError("Unable to load requests.");
        return;
      }
      const data = await response.json();
      if (!cancelled) {
        setRequests(data.requests ?? []);
      }
    }

    loadRequests();
    return () => { cancelled = true; };
  }, [typeFilter, statusFilter, refreshKey]);

  function handleReplySubmitted() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-semibold">Partner Requests</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Restock and training requests from partners.</p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                className={`btn ${typeFilter === t ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
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
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<RequestsEmptyIcon />}
                title="No requests yet"
                description="Partner requests will show up here."
                variant="inset"
              />
            </div>
          ) : (
            requests.map((item) => (
              <RequestCard
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
