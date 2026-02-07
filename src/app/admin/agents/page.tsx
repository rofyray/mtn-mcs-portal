"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminAgentsEmptyIcon } from "@/components/admin-empty-icons";
import { useToast } from "@/components/toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ViewModeToggle from "@/components/view-mode-toggle";
import { useViewMode } from "@/hooks/use-view-mode";

type Business = {
  id: string;
  businessName: string;
  city: string;
  addressCode: string;
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
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const { confirm, confirmDialog, getInputValue } = useConfirmDialog();
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Review and approve agent requests.</p>
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
          <div className="admin-filter-field" style={{ flex: "0 0 auto" }}>
            <ViewModeToggle />
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
                      <>
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
                      </>
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
                  <p className="text-xs text-gray-600 dark:text-gray-400">{agent.phoneNumber}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{agent.email}</p>
                  {agent.business ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
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
