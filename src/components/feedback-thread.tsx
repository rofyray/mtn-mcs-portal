"use client";

import { memo, useMemo } from "react";

import { formatRelativeTime } from "@/lib/date-format";

type Reply = {
  id: string;
  message: string;
  senderType: string;
  senderAdminId: string | null;
  senderPartnerId: string | null;
  createdAt: string;
};

type FeedbackThreadProps = {
  feedbackMessage: string;
  feedbackCreatedAt: string;
  senderName: string;
  replies: Reply[];
  viewerType: "ADMIN" | "PARTNER";
};

function ThreadMessage({
  message,
  senderLabel,
  time,
  isSelf,
}: {
  message: string;
  senderLabel: string;
  time: string;
  isSelf: boolean;
}) {
  return (
    <div className={`feedback-thread-message ${isSelf ? "feedback-thread-message-self" : "feedback-thread-message-other"}`}>
      <span className="feedback-thread-sender">{senderLabel}</span>
      <p className="feedback-thread-text">{message}</p>
      <span className="feedback-thread-time">{time}</span>
    </div>
  );
}

export const FeedbackThread = memo(function FeedbackThread({
  feedbackMessage,
  feedbackCreatedAt,
  senderName,
  replies,
  viewerType,
}: FeedbackThreadProps) {
  const messages = useMemo(() => {
    const items: Array<{
      id: string;
      message: string;
      senderLabel: string;
      isSelf: boolean;
      createdAt: string;
    }> = [
      {
        id: "original",
        message: feedbackMessage,
        senderLabel: senderName,
        isSelf: viewerType === "PARTNER",
        createdAt: feedbackCreatedAt,
      },
      ...replies.map((r) => ({
        id: r.id,
        message: r.message,
        senderLabel: r.senderType === "ADMIN" ? "Admin" : senderName,
        isSelf:
          (viewerType === "ADMIN" && r.senderType === "ADMIN") ||
          (viewerType === "PARTNER" && r.senderType === "PARTNER"),
        createdAt: r.createdAt,
      })),
    ];
    return items;
  }, [feedbackMessage, feedbackCreatedAt, senderName, replies, viewerType]);

  return (
    <div className="feedback-thread">
      {messages.map((m) => (
        <ThreadMessage
          key={m.id}
          message={m.message}
          senderLabel={m.senderLabel}
          time={formatRelativeTime(m.createdAt)}
          isSelf={m.isSelf}
        />
      ))}
    </div>
  );
});
