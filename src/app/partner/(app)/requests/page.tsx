"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { useToast } from "@/components/toast";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";

type Agent = {
  id: string;
  firstName: string;
  surname: string;
  status: string;
};

type Business = {
  id: string;
  businessName: string;
  city: string;
  status: string;
};

const restockItems = ["SIM Cards", "Y'ello Biz", "Y'ello Cameras"] as const;

const restockOptions = restockItems.map((item) => ({ value: item, label: item }));

export default function PartnerRequestsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [trainingMessage, setTrainingMessage] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [restockSelection, setRestockSelection] = useState<string[]>([]);
  const [restockMessage, setRestockMessage] = useState("");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  useAutoDismiss(error, setError);
  useAutoDismiss(status, setStatus);

  useEffect(() => {
    async function loadAgents() {
      const response = await fetch("/api/partner/agents");
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setAgents(data.agents ?? []);
    }

    async function loadBusinesses() {
      const response = await fetch("/api/partner/businesses");
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const approvedBusinesses = (data.businesses ?? []).filter(
        (b: Business) => b.status === "APPROVED"
      );
      setBusinesses(approvedBusinesses);
    }

    loadAgents();
    loadBusinesses();
  }, []);

  const trainingEmptyIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 18a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2H7v-2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8a3 3 0 1 0 6 0a3 3 0 0 0-6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20v-2a5 5 0 0 1 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 20v-2a5 5 0 0 0-5-5" />
    </svg>
  );

  async function submitTraining() {
    setError(null);
    setStatus(null);

    const response = await fetch("/api/partner/requests/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentIds: selectedAgents, message: trainingMessage }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to submit training request.");
      notify({ title: "Training request failed", message: data.error, kind: "error" });
      return;
    }

    setStatus("Training request submitted.");
    notify({ title: "Training request sent", message: "Admins have been notified.", kind: "success" });
    setSelectedAgents([]);
    setTrainingMessage("");
  }

  async function submitRestock() {
    setError(null);
    setStatus(null);

    if (!selectedBusinessId) {
      setError("Please select a business location.");
      notify({ title: "Restock request failed", message: "Please select a business location.", kind: "error" });
      return;
    }

    if (restockSelection.length === 0) {
      setError("Please select at least one item to restock.");
      notify({ title: "Restock request failed", message: "Please select at least one item.", kind: "error" });
      return;
    }

    const response = await fetch("/api/partner/requests/restock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: selectedBusinessId, items: restockSelection, message: restockMessage }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to submit restock request.");
      notify({ title: "Restock request failed", message: data.error, kind: "error" });
      return;
    }

    setStatus("Restock request submitted.");
    notify({ title: "Restock request sent", message: "Admins have been notified.", kind: "success" });
    setSelectedBusinessId("");
    setRestockSelection([]);
    setRestockMessage("");
  }

  async function submitFeedback() {
    setError(null);
    setStatus(null);

    const response = await fetch("/api/partner/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: feedbackTitle, message: feedbackMessage }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to send feedback.");
      notify({ title: "Feedback failed", message: data.error, kind: "error" });
      return;
    }

    setStatus("Feedback sent.");
    notify({ title: "Feedback sent", message: "Thanks for sharing your input.", kind: "success" });
    setFeedbackTitle("");
    setFeedbackMessage("");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-10 glass-panel p-6 page-animate">
        <div>
          <h1 className="text-2xl font-semibold">Requests & Feedback</h1>
          <p className="text-sm text-gray-600">Send operational requests to the MTN admin team.</p>
        </div>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Training request</h2>
          <p className="text-sm text-gray-600">Select agents who need training.</p>
          {agents.length === 0 ? (
            <EmptyState
              icon={trainingEmptyIcon}
              title="No agents available yet"
              description="Add at least one agent before requesting training."
            />
          ) : (
            <>
              <div className="grid gap-2 md:grid-cols-2">
                {agents.map((agent) => (
                  <label key={agent.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedAgents.includes(agent.id)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedAgents((prev) => [...prev, agent.id]);
                        } else {
                          setSelectedAgents((prev) => prev.filter((id) => id !== agent.id));
                        }
                      }}
                    />
                    {agent.firstName} {agent.surname} ({agent.status})
                  </label>
                ))}
              </div>
              <textarea
                className="input"
                rows={3}
                placeholder="Add notes for the training request"
                value={trainingMessage}
                onChange={(event) => setTrainingMessage(event.target.value)}
              />
              <button className="btn btn-primary" type="button" onClick={submitTraining}>
                Submit training request
              </button>
            </>
          )}
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Restock request</h2>
          <p className="text-sm text-gray-600">Request inventory for a business location.</p>
          {businesses.length === 0 ? (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                </svg>
              }
              title="No approved businesses"
              description="You need at least one approved business to request restocking."
            />
          ) : (
            <>
              <div className="space-y-1">
                <label className="form-label">Business Location</label>
                <select
                  className="input"
                  value={selectedBusinessId}
                  onChange={(event) => setSelectedBusinessId(event.target.value)}
                >
                  <option value="">Select a business</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.businessName} ({business.city})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="form-label">Restock Type</label>
                <MultiSelectDropdown
                  label="Restock Type"
                  options={restockOptions}
                  selectedValues={restockSelection}
                  onChange={setRestockSelection}
                  placeholder="Select items to restock"
                />
              </div>
              <textarea
                className="input"
                rows={3}
                placeholder="Add notes for the restock request"
                value={restockMessage}
                onChange={(event) => setRestockMessage(event.target.value)}
              />
              <button
                className="btn btn-primary"
                type="button"
                onClick={submitRestock}
                disabled={!selectedBusinessId || restockSelection.length === 0}
              >
                Submit restock request
              </button>
            </>
          )}
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Feedback</h2>
          <input
            className="input"
            placeholder="Title"
            value={feedbackTitle}
            onChange={(event) => setFeedbackTitle(event.target.value)}
          />
          <textarea
            className="input"
            rows={4}
            placeholder="Message"
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
          />
          <button className="btn btn-primary" type="button" onClick={submitFeedback}>
            Send feedback
          </button>
        </section>

        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {status ? <p className="form-message form-message-success">{status}</p> : null}
      </div>
    </main>
  );
}
