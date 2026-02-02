"use client";

import { useState } from "react";

import { formatGhanaDate, formatRelativeTime } from "@/lib/date-format";

export type FeedbackItem = {
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

export function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [expanded, setExpanded] = useState(false);

  const relativeTime = formatRelativeTime(item.createdAt);
  const fullTime = formatGhanaDate(item.createdAt, { includeTime: true, includeSeconds: true });

  const partnerName = item.partnerProfile
    ? [item.partnerProfile.partnerFirstName, item.partnerProfile.partnerSurname]
        .filter(Boolean)
        .join(" ") || null
    : null;
  const businessName = item.partnerProfile?.businessName;
  const location = item.partnerProfile?.city;

  return (
    <div className="feedback-card">
      <button
        type="button"
        className="feedback-card-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="feedback-card-summary">
          <span className="feedback-card-title">{item.title}</span>
        </div>
        <div className="feedback-card-meta">
          <span className="feedback-card-time">{relativeTime}</span>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="feedback-card-details">
          {/* Partner Section */}
          {item.partnerProfile && (
            <div className="feedback-detail-section">
              <h4 className="feedback-detail-heading">Partner</h4>
              <div className="feedback-detail-grid">
                <DetailRow label="Name" value={partnerName} />
                <DetailRow label="Business Name" value={businessName} />
                <DetailRow label="Location" value={location} />
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="feedback-detail-section">
            <h4 className="feedback-detail-heading">Feedback</h4>
            <div className="feedback-detail-grid feedback-detail-grid-full">
              <DetailRow label="Title" value={item.title} />
              <DetailRow label="Message" value={item.message} />
            </div>
          </div>

          {/* Timestamp Footer */}
          <div className="feedback-card-footer">
            <span className="feedback-timestamp">{fullTime} GMT - Ghana Time</span>
          </div>
        </div>
      )}
    </div>
  );
}
