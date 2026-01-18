import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  variant?: "default" | "inset";
};

export default function EmptyState({ title, description, icon, variant = "default" }: EmptyStateProps) {
  return (
    <div className={`empty-state ${variant === "inset" ? "empty-state-inset" : ""}`}>
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <p className="empty-state-title">{title}</p>
      {description ? <p className="empty-state-description">{description}</p> : null}
    </div>
  );
}
