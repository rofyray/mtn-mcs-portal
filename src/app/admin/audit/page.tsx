"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminAuditEmptyIcon } from "@/components/admin-empty-icons";

type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  admin: { name: string | null; email: string | null } | null;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      const response = await fetch("/api/admin/audit");
      if (!response.ok) {
        setError("Unable to load audit logs.");
        return;
      }
      const data = await response.json();
      setLogs(data.logs ?? []);
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
          {logs.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<AdminAuditEmptyIcon />}
                title="No audit logs yet"
                description="Admin activity will appear here."
                variant="inset"
              />
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="rounded border p-3 text-sm">
                <p className="text-xs text-gray-500">{log.action}</p>
                <p className="text-sm">
                  {log.admin?.name ?? "System"} ({log.admin?.email ?? "n/a"})
                </p>
                <p className="text-xs text-gray-500">
                  {log.targetType}: {log.targetId}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.metadata ? (
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
