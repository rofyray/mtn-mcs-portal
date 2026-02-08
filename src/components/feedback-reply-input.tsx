"use client";

import { memo, useState } from "react";

type FeedbackReplyInputProps = {
  onSubmit: (message: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
};

export const FeedbackReplyInput = memo(function FeedbackReplyInput({
  onSubmit,
  disabled = false,
  placeholder = "Type your reply...",
}: FeedbackReplyInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSubmit(trimmed);
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="feedback-reply-input">
      <textarea
        className="feedback-reply-textarea"
        rows={2}
        placeholder={disabled ? "This thread is closed" : placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled || sending}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <button
        type="button"
        className="feedback-reply-send"
        onClick={handleSubmit}
        disabled={disabled || sending || !message.trim()}
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </div>
  );
});
