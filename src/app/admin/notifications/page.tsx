"use client";

import { useCallback, useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import { AdminNotificationsEmptyIcon } from "@/components/admin-empty-icons";
import {
  NotificationCard,
  type AdminNotification,
} from "@/components/notification-card";
import { useToast } from "@/components/toast";
import ConfirmModal from "@/components/confirm-modal";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const { notify } = useToast();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setError(null);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleMarkAsRead(id: string) {
    setActionLoading(id);
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );

    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      loadNotifications();
      notify({
        title: "Error",
        message: "Failed to mark as read.",
        kind: "error",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      notify({
        title: "Deleted",
        message: "Notification removed.",
        kind: "success",
      });
    } catch {
      loadNotifications();
      notify({ title: "Error", message: "Failed to delete.", kind: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    setActionLoading("all");
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );

    try {
      const res = await fetch("/api/admin/notifications/read-all", {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      notify({
        title: "Done",
        message: "All marked as read.",
        kind: "success",
      });
    } catch {
      loadNotifications();
      notify({
        title: "Error",
        message: "Failed to mark all.",
        kind: "error",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleClearAll() {
    setClearModalOpen(false);
    setActionLoading("clear");
    setNotifications([]);

    try {
      const res = await fetch("/api/admin/notifications/clear", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      notify({
        title: "Cleared",
        message: "All notifications removed.",
        kind: "success",
      });
    } catch {
      loadNotifications();
      notify({ title: "Error", message: "Failed to clear.", kind: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 glass-panel p-6 page-animate">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin Notifications</h1>
            <p className="text-sm text-gray-600">
              System alerts and partner requests.
              {unreadCount > 0 && (
                <span className="notification-unread-count ml-2">
                  <strong>{unreadCount}</strong> unread
                </span>
              )}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="notification-page-actions">
              <button
                type="button"
                className="notification-page-btn notification-page-btn-primary"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading !== null || unreadCount === 0}
              >
                Mark all as read
              </button>
              <button
                type="button"
                className="notification-page-btn notification-page-btn-danger"
                onClick={() => setClearModalOpen(true)}
                disabled={actionLoading !== null}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Loading */}
        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="card">
            <EmptyState
              icon={<AdminNotificationsEmptyIcon />}
              title="No notifications yet"
              description="You're all caught up."
              variant="inset"
            />
          </div>
        )}

        {/* Notification List */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                loading={actionLoading === notification.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        open={clearModalOpen}
        title="Clear All Notifications"
        description="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmLabel="Clear All"
        confirmVariant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setClearModalOpen(false)}
      />
    </main>
  );
}
