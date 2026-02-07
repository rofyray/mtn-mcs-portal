"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAdmin } from "@/contexts/admin-context";
import { ghanaLocations } from "@/lib/ghana-locations";
import EmptyState from "@/components/empty-state";
import { AdminOnboardRequestsEmptyIcon } from "@/components/admin-empty-icons";

type OnboardRequest = {
  id: string;
  businessName: string;
  regionCode: string;
  status: string;
  createdAt: string;
  createdByAdmin: { id: string; name: string; role: string } | null;
  submitterName: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_COORDINATOR", label: "Pending Coordinator" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_MANAGER", label: "Pending Manager" },
  { value: "PENDING_SENIOR_MANAGER", label: "Pending Senior Manager" },
  { value: "PENDING_GOVERNANCE_CHECK", label: "Pending Governance" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
];

function getStatusClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "dr-status dr-status-draft";
    case "PENDING_COORDINATOR":
    case "PENDING_MANAGER":
    case "PENDING_SENIOR_MANAGER":
    case "PENDING_GOVERNANCE_CHECK":
      return "dr-status dr-status-pending";
    case "APPROVED":
      return "dr-status dr-status-approved";
    case "DENIED":
      return "dr-status dr-status-denied";
    default:
      return "dr-status";
  }
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OnboardRequestsPage() {
  const { admin } = useAdmin();
  const [forms, setForms] = useState<OnboardRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/onboard-requests?${params}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setForms(data.forms);
      setPagination(data.pagination);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (admin) fetchForms();
  }, [admin, fetchForms]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6 page-animate panel-loading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Onboard Requests</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              MCS Partner Onboard Request Forms
            </p>
          </div>
        </div>

        {loading ? <span className="panel-spinner" aria-label="Loading" /> : null}

        <div className="admin-filter-bar">
          <div className="admin-filter-field">
            <label className="label" htmlFor="dr-status">
              Status
            </label>
            <select
              id="dr-status"
              className="input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loading && forms.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<AdminOnboardRequestsEmptyIcon />}
              title="No onboard requests yet"
              description="Onboard request forms will show here."
              variant="inset"
            />
          </div>
        ) : forms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 stagger">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/admin/onboard-requests/${form.id}`}
                className="card grid-card space-y-2 block"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{form.businessName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ghanaLocations[form.regionCode]?.name ?? form.regionCode}
                    </p>
                  </div>
                  <span className={getStatusClass(form.status)}>
                    {formatStatusLabel(form.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>By {form.createdByAdmin?.name ?? form.submitterName ?? "Public"}</span>
                  <span>{formatDate(form.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              className="btn btn-secondary text-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary text-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
