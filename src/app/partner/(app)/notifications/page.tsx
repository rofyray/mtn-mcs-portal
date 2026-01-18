"use client";

import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";

type Notification = {
  id: string;
  title: string;
  message: string;
  category: string;
  createdAt: string;
};

export default function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      const response = await fetch("/api/partner/notifications");
      if (!response.ok) {
        setError("Unable to load notifications.");
        return;
      }
      const data = await response.json();
      setNotifications(data.notifications ?? []);
    }

    loadNotifications();
  }, []);

  const notificationsEmptyIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8a6 6 0 0 1 12 0v5l2 2H4l2-2V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6 glass-panel p-6">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-gray-600">Updates from the admin team.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <EmptyState
              icon={notificationsEmptyIcon}
              title="No notifications yet"
              description="You’ll see approval updates and system alerts here."
            />
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
