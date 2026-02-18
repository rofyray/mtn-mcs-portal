"use client";

import { useState, useMemo, useCallback } from "react";
import { useAdmin } from "@/contexts/admin-context";
import { useDebounce } from "@/hooks/use-debounce";
import { ghanaLocations } from "@/lib/ghana-locations";

const REPORT_TYPES = [
  {
    key: "partners",
    title: "Partners",
    description: "All partner profiles with contact details and status.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8" cy="7" r="4" />
        <path d="M17 11h6M20 8v6" />
      </svg>
    ),
    filters: ["status", "partnerSearch"],
    statusOptions: ["DRAFT", "SUBMITTED", "APPROVED", "DENIED", "EXPIRED"],
  },
  {
    key: "agents",
    title: "Agents",
    description: "Agent details including region, business, and partner info.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    filters: ["region", "status", "partnerSearch"],
    statusOptions: ["SUBMITTED", "APPROVED", "DENIED", "EXPIRED"],
  },
  {
    key: "locations",
    title: "Locations",
    description: "Business locations with full address and GPS coordinates.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 11h18" />
        <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
        <path d="M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9" />
        <path d="M9 22v-6h6v6" />
      </svg>
    ),
    filters: ["region", "status", "partnerSearch"],
    statusOptions: ["SUBMITTED", "APPROVED", "DENIED", "EXPIRED"],
  },
  {
    key: "location-coordinates",
    title: "Location Coordinates",
    description: "GPS coordinates for all business locations (lat/long).",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="10" r="3" />
        <path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8Z" />
      </svg>
    ),
    filters: ["region", "status", "partnerSearch", "onlyWithCoords"],
    statusOptions: ["SUBMITTED", "APPROVED", "DENIED", "EXPIRED"],
  },
  {
    key: "training-requests",
    title: "Training Requests",
    description: "Training requests submitted by partners.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" />
      </svg>
    ),
    filters: ["region", "status", "dateRange", "partnerSearch"],
    statusOptions: ["OPEN", "RESPONDED", "CLOSED"],
  },
  {
    key: "restock-requests",
    title: "Restock Requests",
    description: "Restock requests with business and item details.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    filters: ["region", "status", "dateRange", "partnerSearch"],
    statusOptions: ["OPEN", "RESPONDED", "CLOSED"],
  },
  {
    key: "feedback",
    title: "Feedback",
    description: "Partner feedback messages and their status.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 8h8M8 12h6" />
      </svg>
    ),
    filters: ["status", "dateRange", "partnerSearch"],
    statusOptions: ["OPEN", "RESPONDED", "CLOSED"],
  },
] as const;

type ReportKey = (typeof REPORT_TYPES)[number]["key"];

const regionOptions = Object.values(ghanaLocations).map((r) => ({
  code: r.code,
  name: r.name,
}));

export default function AdminReportsPage() {
  const { admin, isLoading } = useAdmin();
  const [selected, setSelected] = useState<ReportKey | null>(null);
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [onlyWithCoords, setOnlyWithCoords] = useState(false);
  const [generating, setGenerating] = useState(false);

  const debouncedSearch = useDebounce(partnerSearch, 300);

  const visibleReportTypes = useMemo(() => {
    if (admin?.role === "MANAGER") {
      return REPORT_TYPES.filter((r) => r.key === "partners" || r.key === "agents");
    }
    return REPORT_TYPES;
  }, [admin?.role]);

  const reportConfig = useMemo(
    () => REPORT_TYPES.find((r) => r.key === selected) ?? null,
    [selected]
  );

  const hasFilter = useCallback(
    (f: string) => reportConfig?.filters.includes(f as never) ?? false,
    [reportConfig]
  );

  const entityReportTypes = ["partners", "agents", "locations", "location-coordinates"];

  function resetFilters() {
    setRegion("");
    setStatus("ALL");
    setDateFrom("");
    setDateTo("");
    setPartnerSearch("");
    setOnlyWithCoords(false);
  }

  function handleSelectReport(key: ReportKey) {
    if (key !== selected) {
      resetFilters();
      // Default to APPROVED for entity reports
      if (entityReportTypes.includes(key)) {
        setStatus("APPROVED");
      }
      setSelected(key);
    }
  }

  async function handleDownload() {
    if (!selected) return;
    setGenerating(true);

    const params = new URLSearchParams({ type: selected });
    if (region) params.set("region", region);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (debouncedSearch) params.set("partnerSearch", debouncedSearch);
    if (onlyWithCoords) params.set("onlyWithCoords", "true");

    try {
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        alert(errData?.error ?? "Failed to generate report");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? `${selected}-report.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Network error while generating report");
    } finally {
      setGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-5xl glass-panel p-6 panel-loading">
          <div className="panel-spinner" />
          <div className="h-8" />
        </div>
      </main>
    );
  }

  if (!admin || (admin.role !== "FULL" && admin.role !== "MANAGER")) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-5xl glass-panel p-6">
          <p className="text-sm text-red-500">You do not have access to reports.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 page-animate">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="glass-panel p-6">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Generate and download CSV reports across the platform.
          </p>
        </div>

        {/* Report type selection */}
        <div className="report-type-grid">
          {visibleReportTypes.map((rt) => (
            <button
              key={rt.key}
              type="button"
              className={`report-type-card card-flat ${selected === rt.key ? "report-type-card-selected" : ""}`}
              onClick={() => handleSelectReport(rt.key)}
            >
              <span className="report-type-icon">{rt.icon}</span>
              <span className="report-type-info">
                <span className="report-type-title">{rt.title}</span>
                <span className="report-type-desc">{rt.description}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Filters + download */}
        {reportConfig && (
          <div className="glass-panel p-6 space-y-5">
            <h2 className="text-lg font-medium">
              {reportConfig.title} Report
            </h2>

            <div className="admin-filter-grid">
              {hasFilter("region") && (
                <div className="admin-filter-field">
                  <label className="block text-xs font-medium mb-1 text-gray-500">Region</label>
                  <select
                    className="input w-full"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="">All regions</option>
                    {regionOptions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {hasFilter("status") && reportConfig.statusOptions.length > 0 && (
                <div className="admin-filter-field">
                  <label className="block text-xs font-medium mb-1 text-gray-500">Status</label>
                  <select
                    className="input w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    {reportConfig.statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {hasFilter("dateRange") && (
                <>
                  <div className="admin-filter-field">
                    <label className="block text-xs font-medium mb-1 text-gray-500">From date</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="admin-filter-field">
                    <label className="block text-xs font-medium mb-1 text-gray-500">To date</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </>
              )}

              {hasFilter("partnerSearch") && (
                <div className="admin-filter-field">
                  <label className="block text-xs font-medium mb-1 text-gray-500">Partner search</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Search by name or business..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                  />
                </div>
              )}

              {hasFilter("onlyWithCoords") && (
                <div className="admin-filter-field flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={onlyWithCoords}
                      onChange={(e) => setOnlyWithCoords(e.target.checked)}
                      className="accent-yellow-500"
                    />
                    Only locations with coordinates
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <svg className="animate-spin inline-block mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="inline-block mr-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download CSV
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
