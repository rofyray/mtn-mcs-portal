"use client";

import { useCallback, useEffect, useState } from "react";
import GhanaMap, { type RegionStat } from "@/components/ghana-map";
import RegionDrilldownPanel from "@/components/region-drilldown-panel";
import { useDebounce } from "@/hooks/use-debounce";

type MapStatsResponse = {
  assignedRegions: string[];
  stats: RegionStat[];
  totalPartners: number;
  totalBusinesses: number;
  totalAgents: number;
  isFiltered?: boolean;
};

const iconProps = {
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function MapReportsDashboard() {
  const [data, setData] = useState<MapStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const fetchStats = useCallback(async (searchQuery: string) => {
    try {
      setSearching(true);
      const url = searchQuery
        ? `/api/admin/map-stats?search=${encodeURIComponent(searchQuery)}`
        : "/api/admin/map-stats";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(debouncedSearch);
  }, [debouncedSearch, fetchStats]);

  function handleRegionClick(regionCode: string) {
    setSelectedRegion(regionCode);
  }

  function handleClosePanel() {
    setSelectedRegion(null);
  }

  if (loading) {
    return (
      <div className="map-reports-page">
        <div className="map-reports-loading">
          <div className="map-reports-spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-reports-page">
        <div className="map-reports-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-reports-page">
      <div className="map-reports-hero map-reports-hero-compact">
        <div className="map-reports-hero-content">
          <div className="map-reports-hero-row">
            <div>
              <p className="map-reports-eyebrow">Senior Manager Dashboard</p>
              <h1 className="map-reports-title">Regional Overview</h1>
            </div>
            <p className="map-reports-subtitle">
              Click on an assigned region to view detailed partner, business, and agent
              information.
            </p>
          </div>
        </div>
      </div>

      <div className="map-reports-summary">
        <div className="summary-card">
          <div className="summary-card-icon">
            <svg viewBox="0 0 24 24" {...iconProps}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8" cy="7" r="4" />
              <path d="M17 11h6M20 8v6" />
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{data?.totalPartners ?? 0}</span>
            <span className="summary-card-label">
              {data?.isFiltered ? "Matching Partners" : "Total Partners"}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon">
            <svg viewBox="0 0 24 24" {...iconProps}>
              <path d="M3 11h18" />
              <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
              <path d="M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9" />
              <path d="M9 22v-6h6v6" />
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{data?.totalBusinesses ?? 0}</span>
            <span className="summary-card-label">
              {data?.isFiltered ? "Matching Businesses" : "Total Businesses"}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon">
            <svg viewBox="0 0 24 24" {...iconProps}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">{data?.totalAgents ?? 0}</span>
            <span className="summary-card-label">
              {data?.isFiltered ? "Matching Agents" : "Total Agents"}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon">
            <svg viewBox="0 0 24 24" {...iconProps}>
              <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
              <path d="M8 2v16M16 6v16" />
            </svg>
          </div>
          <div className="summary-card-content">
            <span className="summary-card-value">
              {data?.isFiltered ? data?.stats.length ?? 0 : data?.assignedRegions.length ?? 0}
            </span>
            <span className="summary-card-label">
              {data?.isFiltered ? "Matching Regions" : "Assigned Regions"}
            </span>
          </div>
        </div>
      </div>

      <div className="map-reports-map-section">
        <div className="map-reports-map-container">
          {data && (
            <GhanaMap
              assignedRegions={data.assignedRegions}
              stats={data.stats}
              onRegionClick={handleRegionClick}
            />
          )}
        </div>

        <div className="map-reports-stats-panel">
          <h2 className="map-reports-stats-title">Region Statistics</h2>

          <div className="map-reports-stats-search">
            <label className="label">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search partners, businesses, agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {searching ? (
            <div className="map-reports-stats-loading">
              <div className="map-reports-spinner-small" />
            </div>
          ) : data?.stats.length === 0 ? (
            <div className="map-reports-stats-empty">
              No regions match your search
            </div>
          ) : (
            <div className="map-reports-stats-list">
              {data?.stats.map((stat) => (
                <button
                  key={stat.regionCode}
                  type="button"
                  className="map-reports-stat-item"
                  onClick={() => handleRegionClick(stat.regionCode)}
                >
                  <div className="map-reports-stat-header">
                    <span className="map-reports-stat-code">{stat.regionCode}</span>
                    <span className="map-reports-stat-name">{stat.regionName}</span>
                  </div>
                  <div className="map-reports-stat-values">
                    <span className="map-reports-stat-value">
                      <strong>{stat.partnerCount}</strong> partners
                    </span>
                    <span className="map-reports-stat-value">
                      <strong>{stat.businessCount}</strong> businesses
                    </span>
                    <span className="map-reports-stat-value">
                      <strong>{stat.agentCount}</strong> agents
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRegion && (
        <RegionDrilldownPanel
          regionCode={selectedRegion}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
