"use client";

import { setAdminActionsEnabled, useAdminActionsEnabled } from "@/hooks/use-admin-actions-enabled";

export default function AdminActionsToggle() {
  const enabled = useAdminActionsEnabled();

  function toggleEnabled() {
    setAdminActionsEnabled(!enabled);
  }

  return (
    <label className="toggle-field">
      <input type="checkbox" checked={enabled} onChange={toggleEnabled} />
      <span className="toggle-ui" aria-hidden="true" />
      <span className="text-sm">Allow approve/deny actions in submission details</span>
    </label>
  );
}
