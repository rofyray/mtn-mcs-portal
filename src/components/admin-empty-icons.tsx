const iconProps = {
  width: 40,
  height: 40,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AdminAuditEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M3 3h18v6H3z" />
      <path d="M8 21h8" />
      <path d="M12 9v8" />
      <path d="M12 17l-2-2" />
      <path d="M12 17l2-2" />
    </svg>
  );
}

export function AdminNotificationsEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function AdminFeedbackEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 9h8M8 13h6" />
    </svg>
  );
}

export function AdminPartnersEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8" cy="7" r="4" />
      <path d="M17 11h6M20 8v6" />
    </svg>
  );
}

export function AdminAgentsEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function AdminBusinessesEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M3 11h18" />
      <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
      <path d="M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9" />
      <path d="M9 22v-6h6v6" />
    </svg>
  );
}

export function AdminOnboardRequestsEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  );
}

export function AdminFormsEmptyIcon() {
  return (
    <svg aria-hidden="true" {...iconProps}>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  );
}
