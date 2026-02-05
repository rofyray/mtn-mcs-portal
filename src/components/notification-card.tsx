"use client";

import { formatRelativeTime } from "@/lib/date-format";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  category: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  readAt: string | null;
  createdAt: string;
};

const CATEGORY_MAP: Record<string, { badge: string; card: string }> = {
  INFO: { badge: "audit-badge-info", card: "audit-card-info" },
  SUCCESS: { badge: "audit-badge-success", card: "audit-card-success" },
  WARNING: { badge: "audit-badge-warning", card: "audit-card-warning" },
  ERROR: { badge: "audit-badge-error", card: "audit-card-error" },
};

type Props = {
  notification: AdminNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
};

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  loading,
}: Props) {
  const isUnread = !notification.readAt;
  const categoryStyle =
    CATEGORY_MAP[notification.category] ?? CATEGORY_MAP.INFO;
  const relativeTime = formatRelativeTime(notification.createdAt);

  return (
    <div
      className={`audit-card ${categoryStyle.card} ${isUnread ? "notification-unread" : ""}`}
    >
      <div className="notification-card-content">
        <div className="notification-card-header">
          <div className="notification-card-title-row">
            {isUnread && <span className="notification-unread-dot" />}
            <span className={`audit-badge ${categoryStyle.badge}`}>
              {notification.category}
            </span>
            <span className="notification-card-title">{notification.title}</span>
          </div>
          <span className="audit-card-time">{relativeTime}</span>
        </div>
        <p className="notification-card-message">{notification.message}</p>
        <div className="notification-card-actions">
          {isUnread && (
            <button
              type="button"
              className="notification-action-btn notification-action-btn-primary"
              onClick={() => onMarkAsRead(notification.id)}
              disabled={loading}
            >
              Mark as read
            </button>
          )}
          <button
            type="button"
            className="notification-action-btn notification-action-btn-danger"
            onClick={() => onDelete(notification.id)}
            disabled={loading}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
