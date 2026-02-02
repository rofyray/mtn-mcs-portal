"use client";

import { useState } from "react";
import Link from "next/link";

import {
  getActionLabel,
  getActionArea,
  getActionCategory,
  type ActionCategory,
} from "@/lib/audit-labels";
import { formatGhanaDate, formatRelativeTime } from "@/lib/date-format";
import { ghanaLocations } from "@/lib/ghana-locations";

export type EnrichedAuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  admin: {
    name: string | null;
    email: string | null;
    role: "FULL" | "COORDINATOR";
    regionCodes: string[];
  } | null;
  targetDetails: {
    name: string;
    email?: string;
    location?: { regionCode: string; city?: string };
    linkedPartner?: { id: string; name: string };
    signerName?: string;
  } | null;
};

function getRegionName(code: string): string {
  const region = ghanaLocations[code];
  return region?.name ?? code;
}

function formatRegionCodes(codes: string[]): string {
  if (codes.length === 0) return "All Regions";
  return codes.map(getRegionName).join(", ");
}

function CategoryBadge({ category, area }: { category: ActionCategory; area: string }) {
  return (
    <span className={`audit-badge audit-badge-${category}`}>
      {area}
    </span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`audit-chevron ${expanded ? "audit-chevron-expanded" : ""}`}
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
    <div className="audit-detail-row">
      <span className="audit-detail-label">{label}</span>
      <span className="audit-detail-value">{value}</span>
    </div>
  );
}

export function AuditLogCard({ log }: { log: EnrichedAuditLog }) {
  const [expanded, setExpanded] = useState(false);

  const category = getActionCategory(log.action);
  const area = getActionArea(log.action);
  const label = getActionLabel(log.action);
  const relativeTime = formatRelativeTime(log.createdAt);
  const fullTime = formatGhanaDate(log.createdAt, { includeTime: true, includeSeconds: true });

  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
  const denialReason = log.metadata?.reason as string | undefined;

  return (
    <div className={`audit-card audit-card-${category}`}>
      <button
        type="button"
        className="audit-card-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="audit-card-summary">
          <CategoryBadge category={category} area={area} />
          <span className="audit-card-label">{label}</span>
        </div>
        <div className="audit-card-meta">
          <span className="audit-card-time">{relativeTime}</span>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="audit-card-details">
          {/* Admin Section */}
          <div className="audit-detail-section">
            <h4 className="audit-detail-heading">Admin</h4>
            <div className="audit-detail-grid">
              <DetailRow label="Name" value={log.admin?.name ?? "System"} />
              <DetailRow label="Email" value={log.admin?.email ?? "n/a"} />
              <DetailRow
                label="Role"
                value={log.admin?.role === "FULL" ? "Full Access" : "Coordinator"}
              />
              <DetailRow
                label="Regions"
                value={log.admin ? formatRegionCodes(log.admin.regionCodes) : "n/a"}
              />
            </div>
          </div>

          {/* Target Section */}
          {log.targetDetails && (
            <div className="audit-detail-section">
              <h4 className="audit-detail-heading">Target ({log.targetType})</h4>
              <div className="audit-detail-grid">
                <DetailRow
                  label="Name"
                  value={
                    log.targetType === "PartnerProfile" ? (
                      <Link
                        href={`/admin/partners/${log.targetId}`}
                        className="audit-link"
                      >
                        {log.targetDetails.name}
                      </Link>
                    ) : log.targetType === "Agent" ? (
                      <Link
                        href={`/admin/agents/${log.targetId}`}
                        className="audit-link"
                      >
                        {log.targetDetails.name}
                      </Link>
                    ) : log.targetType === "Business" ? (
                      <Link
                        href={`/admin/businesses/${log.targetId}`}
                        className="audit-link"
                      >
                        {log.targetDetails.name}
                      </Link>
                    ) : (
                      log.targetDetails.name
                    )
                  }
                />
                {log.targetDetails.email && (
                  <DetailRow label="Email" value={log.targetDetails.email} />
                )}
                {log.targetDetails.location && (
                  <DetailRow
                    label="Location"
                    value={`${log.targetDetails.location.city ?? "Unknown"}, ${getRegionName(log.targetDetails.location.regionCode)}`}
                  />
                )}
                {log.targetDetails.linkedPartner && (
                  <DetailRow
                    label="Partner"
                    value={
                      <Link
                        href={`/admin/partners/${log.targetDetails.linkedPartner.id}`}
                        className="audit-link"
                      >
                        {log.targetDetails.linkedPartner.name}
                      </Link>
                    }
                  />
                )}
                {log.targetDetails.signerName && (
                  <DetailRow label="Signer" value={log.targetDetails.signerName} />
                )}
              </div>
            </div>
          )}

          {/* Metadata Section */}
          {hasMetadata && (
            <div className="audit-detail-section">
              <h4 className="audit-detail-heading">Details</h4>
              <div className="audit-detail-grid">
                {denialReason && <DetailRow label="Reason" value={denialReason} />}
                {Object.entries(log.metadata!)
                  .filter(([key]) => key !== "reason")
                  .map(([key, value]) => (
                    <DetailRow
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                      value={String(value)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Timestamp Footer */}
          <div className="audit-card-footer">
            <span className="audit-timestamp">{fullTime} (Ghana Time)</span>
          </div>
        </div>
      )}
    </div>
  );
}
