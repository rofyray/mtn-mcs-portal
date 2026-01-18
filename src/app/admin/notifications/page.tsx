"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminNotificationsEmptyIcon } from "@/components/admin-empty-icons";

type Notification = {
  id: string;
  title: string;
  message: string;
  category: string;
  createdAt: string;
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      const response = await fetch("/api/admin/notifications");
      if (!response.ok) {
        setError("Unable to load notifications.");
        return;
      }
      const data = await response.json();
      setNotifications(data.notifications ?? []);
    }

    loadNotifications();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Notifications</h1>
          <p className="text-sm text-gray-600">System alerts and partner requests.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<AdminNotificationsEmptyIcon />}
                title="No notifications yet"
                description="You're all caught up."
                variant="inset"
              />
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="rounded border p-3">
                <p className="text-xs text-gray-500">{notification.category}</p>
                <h2 className="text-sm font-semibold">{notification.title}</h2>
                <p className="text-sm text-gray-700">{notification.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
