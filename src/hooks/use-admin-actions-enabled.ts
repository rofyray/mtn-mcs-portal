import { useSyncExternalStore } from "react";

const adminActionsKey = "admin-actions-enabled";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener("admin-actions", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("admin-actions", callback);
  };
}

export function useAdminActionsEnabled() {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(adminActionsKey) === "true",
    () => false
  );
}

export function setAdminActionsEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(adminActionsKey, String(enabled));
  window.dispatchEvent(new Event("admin-actions"));
}
