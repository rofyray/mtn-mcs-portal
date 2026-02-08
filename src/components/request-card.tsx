"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { formatGhanaDate, formatRelativeTime } from "@/lib/date-format";
import { FeedbackThread } from "@/components/feedback-thread";
import { FeedbackReplyInput } from "@/components/feedback-reply-input";

type Reply = {
  id: string;
  message: string;
  senderType: string;
  senderAdminId: string | null;
  senderPartnerId: string | null;
  createdAt: string;
};

export type RequestItem = {
  id: string;
  requestType: "restock" | "training";
  status: string;
  message: string | null;
  items?: string[];
  agentNames?: string[];
  createdAt: string;
  partnerProfile: {
    businessName: string | null;
    partnerFirstName: string | null;
    partnerSurname: string | null;
  } | null;
  business?: {
    businessName: string | null;
    city: string | null;
  } | null;
  _count?: {
    replies: number;
  };
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`feedback-chevron ${expanded ? "feedback-chevron-expanded" : ""}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="feedback-detail-row">
      <span className="feedback-detail-label">{label}</span>
      <span className="feedback-detail-value">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "OPEN"
      ? "feedback-status-open"
      : status === "RESPONDED"
        ? "feedback-status-responded"
        : "feedback-status-closed";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function TypeBadge({ type }: { type: "restock" | "training" }) {
  return (
    <span className={`badge ${type === "restock" ? "badge-info" : "badge-warning"}`}>
      {type === "restock" ? "Restock" : "Training"}
    </span>
  );
}

export const RequestCard = memo(function RequestCard({
  item,
  viewerType = "ADMIN",
  onReplySubmitted,
}: {
  item: RequestItem;
  viewerType?: "ADMIN" | "PARTNER";
  onReplySubmitted?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [localStatus, setLocalStatus] = useState(item.status);

  const { relativeTime, fullTime, partnerName, businessName, summary } = useMemo(() => {
    const pName = item.partnerProfile
      ? [item.partnerProfile.partnerFirstName, item.partnerProfile.partnerSurname]
          .filter(Boolean)
          .join(" ") || "Partner"
      : "Partner";

    let summaryText = "";
    if (item.requestType === "restock") {
      summaryText = item.items?.join(", ") ?? "Restock request";
    } else {
      summaryText = item.agentNames?.join(", ") ?? "Training request";
    }

    return {
      relativeTime: formatRelativeTime(item.createdAt),
      fullTime: formatGhanaDate(item.createdAt, { includeTime: true, includeSeconds: true }),
      partnerName: pName,
      businessName: item.partnerProfile?.businessName,
      summary: summaryText,
    };
  }, [item]);

  const replyCount = item._count?.replies ?? 0;

  const loadThread = useCallback(async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const endpoint =
        viewerType === "ADMIN"
          ? `/api/admin/requests/${item.requestType}/${item.id}`
          : `/api/partner/requests`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (viewerType === "ADMIN") {
          setReplies(data.request?.replies ?? []);
          if (data.request?.status) setLocalStatus(data.request.status);
        } else {
          const allRequests = data.requests ?? [];
          const found = allRequests.find(
            (r: { id: string }) => r.id === item.id
          );
          setReplies(found?.replies ?? []);
          if (found?.status) setLocalStatus(found.status);
        }
      }
    } finally {
      setLoadingReplies(false);
    }
  }, [item.id, item.requestType, viewerType, loadingReplies]);

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && replies.length === 0) {
      await loadThread();
    }
  }

  const handleReply = useCallback(
    async (message: string) => {
      const endpoint =
        viewerType === "ADMIN"
          ? `/api/admin/requests/${item.requestType}/${item.id}/reply`
          : `/api/partner/requests/${item.requestType}/${item.id}/reply`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (response.ok) {
        await loadThread();
        onReplySubmitted?.();
      }
    },
    [item.id, item.requestType, viewerType, loadThread, onReplySubmitted]
  );

  const handleToggleStatus = useCallback(async () => {
    const newStatus = localStatus === "CLOSED" ? "OPEN" : "CLOSED";
    const response = await fetch(`/api/admin/requests/${item.requestType}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) {
      setLocalStatus(newStatus);
      onReplySubmitted?.();
    }
  }, [item.id, item.requestType, localStatus, onReplySubmitted]);

  const originalMessage = item.message || (item.requestType === "restock"
    ? `Restock request: ${item.items?.join(", ") ?? "N/A"}`
    : `Training request for: ${item.agentNames?.join(", ") ?? "N/A"}`);

  return (
    <div className="feedback-card">
      <button
        type="button"
        className="feedback-card-header"
        onClick={handleExpand}
        aria-expanded={expanded}
      >
        <div className="feedback-card-summary">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={item.requestType} />
            <span className="feedback-card-title truncate">{summary}</span>
          </div>
          <div className="feedback-card-badges">
            <StatusBadge status={localStatus} />
            {replyCount > 0 && (
              <span className="feedback-reply-count">
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </span>
            )}
          </div>
        </div>
        <div className="feedback-card-meta">
          <span className="feedback-card-time">{relativeTime}</span>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="feedback-card-details">
          {/* Partner Section */}
          {viewerType === "ADMIN" && item.partnerProfile && (
            <div className="feedback-detail-section">
              <h4 className="feedback-detail-heading">Partner</h4>
              <div className="feedback-detail-grid">
                <DetailRow label="Name" value={partnerName} />
                <DetailRow label="Business Name" value={businessName} />
                {item.business && (
                  <DetailRow label="Location" value={`${item.business.businessName} (${item.business.city})`} />
                )}
              </div>
            </div>
          )}

          {/* Request Details */}
          <div className="feedback-detail-section">
            <h4 className="feedback-detail-heading">Request Details</h4>
            <div className="feedback-detail-grid">
              <DetailRow label="Type" value={item.requestType === "restock" ? "Restock" : "Training"} />
              {item.requestType === "restock" && item.items && (
                <DetailRow label="Items" value={item.items.join(", ")} />
              )}
              {item.requestType === "training" && item.agentNames && (
                <DetailRow label="Agents" value={item.agentNames.join(", ")} />
              )}
            </div>
          </div>

          {/* Thread */}
          <div className="feedback-detail-section">
            <h4 className="feedback-detail-heading">Conversation</h4>
            {loadingReplies && replies.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading thread...</p>
            ) : (
              <FeedbackThread
                feedbackMessage={originalMessage}
                feedbackCreatedAt={item.createdAt}
                senderName={partnerName}
                replies={replies}
                viewerType={viewerType}
              />
            )}
          </div>

          {/* Reply input */}
          <FeedbackReplyInput
            onSubmit={handleReply}
            disabled={localStatus === "CLOSED"}
          />

          {/* Admin actions */}
          {viewerType === "ADMIN" && (
            <div className="feedback-card-actions">
              <button
                type="button"
                className={`btn ${localStatus === "CLOSED" ? "btn-secondary" : "btn-danger-light"}`}
                onClick={handleToggleStatus}
              >
                {localStatus === "CLOSED" ? "Reopen Thread" : "Close Thread"}
              </button>
            </div>
          )}

          {/* Timestamp Footer */}
          <div className="feedback-card-footer">
            <span className="feedback-timestamp">{fullTime} GMT - Ghana Time</span>
          </div>
        </div>
      )}
    </div>
  );
});
