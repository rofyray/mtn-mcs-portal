"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminAgentsEmptyIcon } from "@/components/admin-empty-icons";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { ghanaLocations } from "@/lib/ghana-locations";
import ViewModeToggle from "@/components/view-mode-toggle";
import { useViewMode } from "@/hooks/use-view-mode";

type Business = {
  id: string;
  businessName: string;
  city: string;
  addressCode: string;
  addressRegionCode: string;
};

type Agent = {
  id: string;
  firstName: string;
  surname: string;
  phoneNumber: string;
  email: string;
  status: string;
  businessName?: string | null;
  businessId: string;
  business?: Business;
};

const statusOptions = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
  { value: "EXPIRED", label: "Expired" },
];

export default function AdminAgentsPage() {
  const [status, setStatus] = useState("SUBMITTED");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewMode = useViewMode();
  const statusLabel = statusOptions.find((option) => option.value === status)?.label ?? status;
  const statusLabelLower = statusLabel.toLowerCase();

  async function loadAgents(selectedStatus: string) {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/agents?status=${selectedStatus}`);
    if (!response.ok) {
      setError("Unable to load agents.");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setAgents(data.agents ?? []);
    setAdminRole(data.adminRole ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAgents(status);
  }, [status]);

  const businessOptions = useMemo(() => {
    return Array.from(
      new Set(
        agents
          .map((agent) => agent.businessName)
          .filter((name): name is string => Boolean(name))
      )
    ).sort();
  }, [agents]);

  const regionOptions = useMemo(() => {
    return Object.values(ghanaLocations)
      .map((region) => ({
        value: region.code,
        label: region.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const filteredAgents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return agents.filter((agent) => {
      if (selectedBusiness && agent.businessName !== selectedBusiness) {
        return false;
      }
      if (
        selectedRegions.length > 0 &&
        (!agent.business?.addressRegionCode ||
          !selectedRegions.includes(agent.business.addressRegionCode))
      ) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const fullName = `${agent.firstName} ${agent.surname}`.toLowerCase();
      return (
        fullName.includes(normalizedSearch) ||
        agent.email.toLowerCase().includes(normalizedSearch) ||
        agent.phoneNumber.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [agents, searchQuery, selectedBusiness, selectedRegions]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6 page-animate panel-loading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agent Submissions</h1>
            <p className="text-sm text-subtext">Review and approve agent requests.</p>
          </div>
        </div>
        {loading ? <span className="panel-spinner" aria-label="Loading" /> : null}
        <div className="admin-filter-bar admin-filter-grid">
          <div className="admin-filter-field admin-filter-span-2">
            <label className="label" htmlFor="agent-search">
              Search
            </label>
            <input
              id="agent-search"
              className="input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name, email, or phone"
              aria-label="Search agents"
            />
          </div>
          <div className="admin-filter-field">
            <label className="label" htmlFor="agent-status">
              Status
            </label>
            <select
              id="agent-status"
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-filter-field">
            <label className="label" htmlFor="agent-business">
              Location
            </label>
            <select
              id="agent-business"
              className="input"
              value={selectedBusiness}
              onChange={(event) => setSelectedBusiness(event.target.value)}
            >
              <option value="">All locations</option>
              {businessOptions.map((business) => (
                <option key={business} value={business}>
                  {business}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-filter-field">
            <label className="label">Regions</label>
            <MultiSelectDropdown
              label="Regions"
              placeholder="All regions"
              options={regionOptions}
              selectedValues={selectedRegions}
              onChange={setSelectedRegions}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginLeft: "auto" }}>
            <ViewModeToggle />
          </div>
        </div>

        <p className="text-xs text-subtext">Showing {filteredAgents.length} agents</p>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        

        {filteredAgents.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<AdminAgentsEmptyIcon />}
              title={
                searchQuery.trim() || selectedBusiness || selectedRegions.length > 0
                  ? `No ${statusLabelLower} agents match those filters`
                  : status === "SUBMITTED"
                    ? "No agents submitted yet"
                    : `No ${statusLabelLower} agents yet`
              }
              description={
                searchQuery.trim() || selectedBusiness || selectedRegions.length > 0
                  ? "Try adjusting the search, status, or location filter."
                  : status === "SUBMITTED"
                    ? "Agent onboarding requests will appear here."
                    : `Once agents are ${statusLabelLower}, they'll appear here.`
              }
              variant="inset"
            />
          </div>
        ) : viewMode === "list" ? (
          <div className="submission-list submission-list-agents">
            <div className="submission-list-header">
              <span>Status</span>
              <span>Name</span>
              <span>Phone</span>
              <span>Email</span>
              <span>Location</span>
              <span>Actions</span>
            </div>
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="submission-list-row">
                <span className="submission-list-cell" data-label="Status">
                  <span
                    className={`badge badge-${
                      agent.status === "APPROVED"
                        ? "success"
                        : agent.status === "DENIED"
                          ? "error"
                          : agent.status === "EXPIRED"
                            ? "warning"
                            : "info"
                    }`}
                  >
                    {agent.status}
                  </span>
                </span>
                <span className="submission-list-cell" data-label="Name">
                  {agent.firstName} {agent.surname}
                </span>
                <span className="submission-list-cell submission-list-cell-muted" data-label="Phone">
                  {agent.phoneNumber}
                </span>
                <span className="submission-list-cell submission-list-cell-muted" data-label="Email">
                  {agent.email}
                </span>
                <span className="submission-list-cell submission-list-cell-muted" data-label="Location">
                  {agent.businessName ?? "-"}
                </span>
                <div className="submission-list-actions" data-label="Actions">
                  {adminRole ? (
                    adminRole === "FULL" ? (
                      <a className="btn btn-secondary" href={`/admin/agents/${agent.id}`}>
                        View details
                      </a>
                    ) : (
                      <a className="btn btn-secondary" href={`/admin/agents/${agent.id}`}>
                        View & edit
                      </a>
                    )
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 justify-items-start stagger">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="card grid-card space-y-3">
                <div>
                  <span className={`badge badge-${
                    agent.status === "APPROVED" ? "success"
                      : agent.status === "DENIED" ? "error"
                      : agent.status === "EXPIRED" ? "warning"
                      : "info"
                  }`}>
                    {agent.status}
                  </span>
                  <p className="text-lg font-semibold">
                    {agent.firstName} {agent.surname}
                  </p>
                  <p className="text-xs text-subtext">{agent.phoneNumber}</p>
                  <p className="text-xs text-subtext">{agent.email}</p>
                  {agent.business ? (
                    <p className="text-xs text-subtext">
                      Location: {agent.business.city} ({agent.business.addressCode})
                    </p>
                  ) : null}
                </div>
                {adminRole ? (
                  adminRole === "FULL" ? (
                    <a className="btn btn-secondary" href={`/admin/agents/${agent.id}`}>
                      View details
                    </a>
                  ) : (
                    <a className="btn btn-secondary" href={`/admin/agents/${agent.id}`}>
                      View & edit
                    </a>
                  )
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
