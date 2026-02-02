"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminAuditEmptyIcon } from "@/components/admin-empty-icons";
import { AuditLogCard, type EnrichedAuditLog } from "@/components/audit-log-card";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<EnrichedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const response = await fetch("/api/admin/audit");
      if (!response.ok) {
        setError("Unable to load audit logs.");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setLogs(data.logs ?? []);
      setLoading(false);
    }

    loadLogs();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-gray-600">Admin actions across partner workflows.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {loading ? (
            <div className="audit-loading">
              <div className="audit-spinner" />
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<AdminAuditEmptyIcon />}
                title="No audit logs yet"
                description="Admin activity will appear here."
                variant="inset"
              />
            </div>
          ) : (
            logs.map((log) => <AuditLogCard key={log.id} log={log} />)
          )}
        </div>
      </div>
    </main>
  );
}
