"use client";

import { memo, useMemo, useState } from "react";
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
    role: string;
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

const ROLE_LABELS: Record<string, string> = {
  FULL: "Full Access",
  MANAGER: "Manager",
  COORDINATOR: "Coordinator",
  SENIOR_MANAGER: "Senior Manager",
  GOVERNANCE: "Governance",
};

function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

type FieldChangeEntry = {
  field: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
  isUrl?: boolean;
};

function ValueDisplay({ value, isUrl }: { value: string | null; isUrl?: boolean }) {
  if (!value) return <span className="audit-changes-empty">(empty)</span>;
  if (isUrl) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="audit-link">
        View file
      </a>
    );
  }
  if (value.length > 80) {
    return <span title={value}>{value.slice(0, 80)}...</span>;
  }
  return <>{value}</>;
}

function ChangesSection({ changes }: { changes: FieldChangeEntry[] }) {
  return (
    <div className="audit-detail-section">
      <h4 className="audit-detail-heading">Changes</h4>
      <div className="audit-changes-table">
        <div className="audit-changes-header">
          <span>Field</span>
          <span>Old Value</span>
          <span>New Value</span>
        </div>
        {changes.map((change) => (
          <div key={change.field} className="audit-changes-row">
            <span className="audit-changes-field">{change.label}</span>
            <span className="audit-changes-old">
              <span className="audit-changes-mobile-label">Was: </span>
              <ValueDisplay value={change.oldValue} isUrl={change.isUrl} />
            </span>
            <span className="audit-changes-new">
              <span className="audit-changes-mobile-label">Now: </span>
              <ValueDisplay value={change.newValue} isUrl={change.isUrl} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const AuditLogCard = memo(function AuditLogCard({ log }: { log: EnrichedAuditLog }) {
  const [expanded, setExpanded] = useState(false);

  const { category, area, label, relativeTime, fullTime } = useMemo(
    () => ({
      category: getActionCategory(log.action),
      area: getActionArea(log.action),
      label: getActionLabel(log.action),
      relativeTime: formatRelativeTime(log.createdAt),
      fullTime: formatGhanaDate(log.createdAt, { includeTime: true, includeSeconds: true }),
    }),
    [log.action, log.createdAt]
  );

  const metadataChanges = log.metadata?.changes as FieldChangeEntry[] | undefined;
  const denialReason = log.metadata?.reason as string | undefined;
  const hasOtherMetadata =
    log.metadata &&
    Object.keys(log.metadata).some(
      (key) => !["reason", "changes"].includes(key)
    ) || !!denialReason;

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
                value={log.admin ? formatRole(log.admin.role) : "n/a"}
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
                    ) : log.targetType === "OnboardRequestForm" ? (
                      <Link
                        href={`/admin/onboard-requests/${log.targetId}`}
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

          {/* Structured Changes Section */}
          {metadataChanges && metadataChanges.length > 0 && (
            <ChangesSection changes={metadataChanges} />
          )}

          {/* Other Metadata */}
          {hasOtherMetadata && (
            <div className="audit-detail-section">
              <h4 className="audit-detail-heading">Details</h4>
              <div className="audit-detail-grid">
                {denialReason && <DetailRow label="Reason" value={denialReason} />}
                {Object.entries(log.metadata!)
                  .filter(([key]) => !["reason", "changes"].includes(key))
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
            <span className="audit-timestamp">{fullTime} GMT - Ghana Time</span>
          </div>
        </div>
      )}
    </div>
  );
});
