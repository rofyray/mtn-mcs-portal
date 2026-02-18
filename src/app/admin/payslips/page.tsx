"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { useDebounce } from "@/hooks/use-debounce";

const FilePreviewModal = dynamic(() => import("@/components/file-preview-modal"));

type PaySlipItem = {
  id: string;
  partnerProfileId: string;
  imageUrl: string;
  originalFilename: string;
  displayFilename: string;
  createdAt: string;
  partnerProfile: {
    id: string;
    businessName: string | null;
    partnerFirstName: string | null;
    partnerSurname: string | null;
  };
};

type PartnerGroup = {
  id: string;
  name: string;
  count: number;
};

type YearGroup = {
  year: number;
  count: number;
};

type MonthGroup = {
  month: number;
  label: string;
  count: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AdminPaySlipsPage() {
  const [allSlips, setAllSlips] = useState<PaySlipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Drill-down state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null);
  const { notify } = useToast();

  const loadSlips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/payslips");
      if (!response.ok) {
        notify({ title: "Error", message: "Unable to load pay slips.", kind: "error" });
        return;
      }
      const data = await response.json();
      setAllSlips(data.paySlips ?? []);
    } catch {
      notify({ title: "Error", message: "Unable to load pay slips.", kind: "error" });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadSlips();
  }, [loadSlips]);

  // Group by partner
  const partnerGroups = useMemo<PartnerGroup[]>(() => {
    const map = new Map<string, PartnerGroup>();
    for (const slip of allSlips) {
      const p = slip.partnerProfile;
      if (!map.has(p.id)) {
        const name =
          [p.partnerFirstName, p.partnerSurname].filter(Boolean).join(" ") ||
          p.businessName ||
          "Unknown Partner";
        map.set(p.id, { id: p.id, name, count: 0 });
      }
      map.get(p.id)!.count++;
    }
    const groups = [...map.values()];
    groups.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  }, [allSlips]);

  // Filtered partners by search
  const filteredPartners = useMemo(() => {
    if (!debouncedSearch) return partnerGroups;
    const q = debouncedSearch.toLowerCase();
    return partnerGroups.filter((p) => p.name.toLowerCase().includes(q));
  }, [partnerGroups, debouncedSearch]);

  // Slips for selected partner
  const partnerSlips = useMemo(
    () => allSlips.filter((s) => s.partnerProfileId === selectedPartnerId),
    [allSlips, selectedPartnerId]
  );

  // Group by year
  const yearGroups = useMemo<YearGroup[]>(() => {
    const map = new Map<number, number>();
    for (const slip of partnerSlips) {
      const year = new Date(slip.createdAt).getFullYear();
      map.set(year, (map.get(year) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);
  }, [partnerSlips]);

  // Group by month (for selected year)
  const monthGroups = useMemo<MonthGroup[]>(() => {
    if (selectedYear === null) return [];
    const map = new Map<number, number>();
    for (const slip of partnerSlips) {
      const d = new Date(slip.createdAt);
      if (d.getFullYear() !== selectedYear) continue;
      const month = d.getMonth();
      map.set(month, (map.get(month) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([month, count]) => ({ month, label: MONTH_NAMES[month], count }))
      .sort((a, b) => b.month - a.month);
  }, [partnerSlips, selectedYear]);

  // Files for selected month
  const monthFiles = useMemo(() => {
    if (selectedYear === null || selectedMonth === null) return [];
    return partnerSlips.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [partnerSlips, selectedYear, selectedMonth]);

  // Get selected partner name
  const selectedPartnerName = useMemo(
    () => partnerGroups.find((p) => p.id === selectedPartnerId)?.name ?? "",
    [partnerGroups, selectedPartnerId]
  );

  // Breadcrumb click handlers
  function goToRoot() {
    setSelectedPartnerId(null);
    setSelectedYear(null);
    setSelectedMonth(null);
  }

  function goToPartner() {
    setSelectedYear(null);
    setSelectedMonth(null);
  }

  function goToYear() {
    setSelectedMonth(null);
  }

  const emptyIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 3 3 5-5 4 4" />
      <circle cx="9" cy="9" r="1.5" />
    </svg>
  );

  const folderIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-5xl glass-panel p-6 page-animate">
          <h1 className="text-2xl font-semibold">Pay Slips</h1>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Pay Slips</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse partner payment slip uploads.
          </p>
        </div>

        {/* Breadcrumb */}
        {selectedPartnerId ? (
          <nav className="flex items-center gap-1 text-sm flex-wrap">
            <button type="button" className="link-accent" onClick={goToRoot}>
              All Partners
            </button>
            <span className="text-gray-400">/</span>
            {selectedYear === null ? (
              <span className="font-medium">{selectedPartnerName}</span>
            ) : (
              <button type="button" className="link-accent" onClick={goToPartner}>
                {selectedPartnerName}
              </button>
            )}
            {selectedYear !== null ? (
              <>
                <span className="text-gray-400">/</span>
                {selectedMonth === null ? (
                  <span className="font-medium">{selectedYear}</span>
                ) : (
                  <button type="button" className="link-accent" onClick={goToYear}>
                    {selectedYear}
                  </button>
                )}
              </>
            ) : null}
            {selectedMonth !== null ? (
              <>
                <span className="text-gray-400">/</span>
                <span className="font-medium">{MONTH_NAMES[selectedMonth]}</span>
              </>
            ) : null}
          </nav>
        ) : null}

        {/* Level: Partners */}
        {!selectedPartnerId ? (
          <>
            <input
              className="input"
              placeholder="Search partners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filteredPartners.length === 0 ? (
              <EmptyState
                icon={emptyIcon}
                title="No pay slips found"
                description={debouncedSearch ? "No partners match your search." : "No partners have uploaded pay slips yet."}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 stagger">
                {filteredPartners.map((partner) => (
                  <button
                    key={partner.id}
                    type="button"
                    className="card-flat p-4 text-left flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-black/10 transition-shadow"
                    onClick={() => setSelectedPartnerId(partner.id)}
                  >
                    <span className="text-gray-400">{folderIcon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{partner.name}</p>
                      <p className="text-xs text-gray-500">{partner.count} slip{partner.count !== 1 ? "s" : ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}

        {/* Level: Years */}
        {selectedPartnerId && selectedYear === null ? (
          yearGroups.length === 0 ? (
            <EmptyState icon={emptyIcon} title="No pay slips" description="This partner has no pay slips." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 stagger">
              {yearGroups.map((yg) => (
                <button
                  key={yg.year}
                  type="button"
                  className="card-flat p-4 text-left flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-black/10 transition-shadow"
                  onClick={() => setSelectedYear(yg.year)}
                >
                  <span className="text-gray-400">{folderIcon}</span>
                  <div>
                    <p className="text-sm font-medium">{yg.year}</p>
                    <p className="text-xs text-gray-500">{yg.count} slip{yg.count !== 1 ? "s" : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : null}

        {/* Level: Months */}
        {selectedYear !== null && selectedMonth === null ? (
          monthGroups.length === 0 ? (
            <EmptyState icon={emptyIcon} title="No pay slips" description="No pay slips for this year." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 stagger">
              {monthGroups.map((mg) => (
                <button
                  key={mg.month}
                  type="button"
                  className="card-flat p-4 text-left flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-black/10 transition-shadow"
                  onClick={() => setSelectedMonth(mg.month)}
                >
                  <span className="text-gray-400">{folderIcon}</span>
                  <div>
                    <p className="text-sm font-medium">{mg.label}</p>
                    <p className="text-xs text-gray-500">{mg.count} slip{mg.count !== 1 ? "s" : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : null}

        {/* Level: Files */}
        {selectedMonth !== null ? (
          monthFiles.length === 0 ? (
            <EmptyState icon={emptyIcon} title="No pay slips" description="No pay slips for this month." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 stagger">
              {monthFiles.map((slip) => (
                <button
                  key={slip.id}
                  type="button"
                  className="card-flat p-3 text-left space-y-2 cursor-pointer hover:ring-2 hover:ring-black/10 transition-shadow"
                  onClick={() => setPreview({ url: slip.imageUrl, label: slip.displayFilename })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slip.imageUrl}
                    alt={slip.displayFilename}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-xs font-medium truncate">{slip.displayFilename}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(slip.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </button>
              ))}
            </div>
          )
        ) : null}
      </div>

      {preview ? (
        <FilePreviewModal
          open
          url={preview.url}
          label={preview.label}
          kind="image"
          onClose={() => setPreview(null)}
        />
      ) : null}
    </main>
  );
}
