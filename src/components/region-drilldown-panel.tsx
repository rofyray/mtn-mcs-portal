"use client";

import { useCallback, useEffect, useState } from "react";

type Agent = {
  id: string;
  firstName: string;
  surname: string;
  phoneNumber: string;
  email: string;
  status: string;
};

type Business = {
  id: string;
  businessName: string;
  city: string;
  district: string;
  status: string;
  partnerName: string;
  agentCount: number;
  agents: Agent[];
};

type DrilldownData = {
  regionCode: string;
  regionName: string;
  businesses: Business[];
  totalPartners: number;
  totalBusinesses: number;
  totalAgents: number;
};

type RegionDrilldownPanelProps = {
  regionCode: string;
  onClose: () => void;
};

const iconProps = {
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function RegionDrilldownPanel({
  regionCode,
  onClose,
}: RegionDrilldownPanelProps) {
  const [data, setData] = useState<DrilldownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedBusiness, setExpandedBusiness] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const url = `/api/admin/map-stats/${regionCode}?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to fetch data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [regionCode, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <div className="drilldown-overlay" onClick={onClose} />
      <aside className="drilldown-panel">
        <div className="drilldown-header">
          <div>
            <h2 className="drilldown-title">{data?.regionName ?? regionCode}</h2>
            <p className="drilldown-subtitle">
              {data
                ? `${data.totalPartners} partners, ${data.totalBusinesses} locations, ${data.totalAgents} agents`
                : "Loading..."}
            </p>
          </div>
          <button
            type="button"
            className="drilldown-close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <svg viewBox="0 0 24 24" {...iconProps}>
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="drilldown-filters">
          <div className="drilldown-filter-group drilldown-filter-search-full">
            <label className="label">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search partners, businesses, agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="drilldown-content">
          {loading ? (
            <div className="drilldown-loading">
              <div className="drilldown-spinner" />
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="drilldown-error">
              <p>{error}</p>
              <button type="button" className="btn btn-secondary" onClick={fetchData}>
                Retry
              </button>
            </div>
          ) : data?.businesses.length === 0 ? (
            <div className="drilldown-empty">
              <svg viewBox="0 0 24 24" {...iconProps} width={48} height={48}>
                <path d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9" />
              </svg>
              <p>No businesses found</p>
            </div>
          ) : (
            <div className="drilldown-list">
              {data?.businesses.map((business) => (
                <div key={business.id} className="drilldown-card">
                  <button
                    type="button"
                    className="drilldown-card-header"
                    onClick={() =>
                      setExpandedBusiness(
                        expandedBusiness === business.id ? null : business.id
                      )
                    }
                  >
                    <div className="drilldown-card-info">
                      <h3 className="drilldown-card-title">{business.businessName}</h3>
                      <p className="drilldown-card-subtitle">
                        {business.partnerName} &bull; {business.city}
                      </p>
                    </div>
                    <div className="drilldown-card-meta">
                      <span className="drilldown-card-count">
                        {business.agentCount} agent{business.agentCount !== 1 ? "s" : ""}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        {...iconProps}
                        className={`drilldown-chevron ${expandedBusiness === business.id ? "drilldown-chevron-expanded" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {expandedBusiness === business.id && business.agents.length > 0 && (
                    <div className="drilldown-card-agents">
                      <div className="drilldown-agents-header">Agents</div>
                      {business.agents.map((agent) => (
                        <div key={agent.id} className="drilldown-agent">
                          <div className="drilldown-agent-info">
                            <span className="drilldown-agent-name">
                              {agent.firstName} {agent.surname}
                            </span>
                            <span className="drilldown-agent-contact">
                              {agent.phoneNumber}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {expandedBusiness === business.id && business.agents.length === 0 && (
                    <div className="drilldown-card-agents">
                      <p className="drilldown-no-agents">No agents assigned</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
