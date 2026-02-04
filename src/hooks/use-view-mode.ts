import { useSyncExternalStore } from "react";

export type ViewMode = "grid" | "list";

const viewModeKey = "admin-view-mode";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener("view-mode-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("view-mode-change", callback);
  };
}

export function useViewMode(): ViewMode {
  return useSyncExternalStore(
    subscribe,
    () => (window.localStorage.getItem(viewModeKey) as ViewMode) || "grid",
    () => "grid"
  );
}

export function setViewMode(mode: ViewMode) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(viewModeKey, mode);
  window.dispatchEvent(new Event("view-mode-change"));
}
