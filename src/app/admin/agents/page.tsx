"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminAgentsEmptyIcon } from "@/components/admin-empty-icons";
import { useToast } from "@/components/toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { ghanaLocations } from "@/lib/ghana-locations";

type Agent = {
  id: string;
  firstName: string;
  surname: string;
  phoneNumber: string;
  email: string;
  status: string;
  businessName?: string | null;
  addressRegionCode?: string | null;
  addressDistrictCode?: string | null;
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
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const { confirm, confirmDialog, getInputValue } = useConfirmDialog();
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

  async function handleApprove(id: string) {
    const confirmed = await confirm({
      title: "Approve agent?",
      description: "This will mark the submission as approved.",
      confirmLabel: "Approve",
      confirmVariant: "primary",
    });
    if (!confirmed) {
      return;
    }
    const response = await fetch(`/api/admin/agents/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      setError("Unable to approve agent.");
      notify({ title: "Approval failed", message: "Unable to approve agent.", kind: "error" });
      return;
    }
    notify({ title: "Agent approved", message: "Agent status updated.", kind: "success" });
    loadAgents(status);
  }

  async function handleDeny(id: string) {
    const confirmed = await confirm({
      title: "Deny agent?",
      description: "Provide a reason for denying this submission.",
      confirmLabel: "Deny",
      confirmVariant: "danger",
      inputLabel: "Reason for denial",
      inputPlaceholder: "Add a brief reason",
      inputRequired: true,
    });
    if (!confirmed) {
      return;
    }
    const reason = getInputValue().trim();
    if (!reason) {
      return;
    }
    const response = await fetch(`/api/admin/agents/${id}/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      setError("Unable to deny agent.");
      notify({ title: "Denial failed", message: "Unable to deny agent.", kind: "error" });
      return;
    }
    notify({ title: "Agent denied", message: "Agent status updated.", kind: "warning" });
    loadAgents(status);
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

  function getRegionName(code?: string | null) {
    if (!code) {
      return null;
    }
    return ghanaLocations[code]?.name ?? null;
  }

  function getDistrictName(regionCode?: string | null, districtCode?: string | null) {
    if (!regionCode || !districtCode) {
      return null;
    }
    return (
      ghanaLocations[regionCode]?.districts.find((district) => district.code === districtCode)
        ?.name ?? null
    );
  }

  const filteredAgents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return agents.filter((agent) => {
        if (!selectedBusiness) {
          return true;
        }
        return agent.businessName === selectedBusiness;
      });
    }
    return agents.filter((agent) => {
      if (selectedBusiness && agent.businessName !== selectedBusiness) {
        return false;
      }
      const fullName = `${agent.firstName} ${agent.surname}`.toLowerCase();
      return (
        fullName.includes(normalizedSearch) ||
        agent.email.toLowerCase().includes(normalizedSearch) ||
        agent.phoneNumber.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [agents, searchQuery, selectedBusiness]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6 page-animate panel-loading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agent Submissions</h1>
            <p className="text-sm text-gray-600">Review and approve agent requests.</p>
          </div>
        </div>
        {loading ? <span className="panel-spinner" aria-label="Loading" /> : null}
        <div className="admin-filter-bar">
          <div className="admin-filter-field">
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
              Business
            </label>
            <select
              id="agent-business"
              className="input"
              value={selectedBusiness}
              onChange={(event) => setSelectedBusiness(event.target.value)}
            >
              <option value="">All businesses</option>
              {businessOptions.map((business) => (
                <option key={business} value={business}>
                  {business}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        

        {filteredAgents.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<AdminAgentsEmptyIcon />}
              title={
                searchQuery.trim() || selectedBusiness
                  ? `No ${statusLabelLower} agents match those filters`
                  : status === "SUBMITTED"
                    ? "No agents submitted yet"
                    : `No ${statusLabelLower} agents yet`
              }
              description={
                searchQuery.trim() || selectedBusiness
                  ? "Try adjusting the search, status, or business filter."
                  : status === "SUBMITTED"
                    ? "Agent onboarding requests will appear here."
                    : `Once agents are ${statusLabelLower}, they'll appear here.`
              }
              variant="inset"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="rounded border p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{agent.status}</p>
                  <p className="text-sm font-medium">
                    {agent.firstName} {agent.surname}
                  </p>
                  <p className="text-xs text-gray-600">{agent.phoneNumber}</p>
                  <p className="text-xs text-gray-600">{agent.email}</p>
                  {agent.addressRegionCode && agent.addressDistrictCode ? (
                    <>
                      <p className="text-xs text-gray-600">
                        {getRegionName(agent.addressRegionCode) ?? "Region"} ·{" "}
                        {getDistrictName(agent.addressRegionCode, agent.addressDistrictCode) ?? "District"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Codes: {agent.addressRegionCode} · {agent.addressDistrictCode}
                      </p>
                    </>
                  ) : null}
                </div>
                {adminRole ? (
                  adminRole === "FULL" ? (
                    <a className="btn btn-secondary" href={`/admin/agents/${agent.id}`}>
                      View details
                    </a>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <a className="btn btn-secondary" href={`/admin/agents/${agent.id}`}>
                        View & edit
                      </a>
                      {agent.status === "SUBMITTED" ? (
                        <>
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => handleApprove(agent.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger-light"
                            type="button"
                            onClick={() => handleDeny(agent.id)}
                          >
                            Deny
                          </button>
                        </>
                      ) : null}
                    </div>
                  )
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      {confirmDialog}
    </main>
  );
}
