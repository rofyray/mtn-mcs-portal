"use client";

import { useViewMode, setViewMode, type ViewMode } from "@/hooks/use-view-mode";

function GridIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export default function ViewModeToggle() {
  const viewMode = useViewMode();

  function handleToggle(mode: ViewMode) {
    setViewMode(mode);
  }

  return (
    <div className="view-mode-toggle">
      <button
        type="button"
        className={`view-mode-btn ${viewMode === "grid" ? "view-mode-btn-active" : ""}`}
        onClick={() => handleToggle("grid")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        className={`view-mode-btn ${viewMode === "list" ? "view-mode-btn-active" : ""}`}
        onClick={() => handleToggle("list")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <ListIcon />
      </button>
    </div>
  );
}
