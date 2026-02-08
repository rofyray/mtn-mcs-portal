"use client";

import { useEffect, useState } from "react";

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message.includes("ChunkLoadError") ||
    error.message.includes("Loading chunk") ||
    error.message.includes("Failed to fetch dynamically imported module")
  );
}

export default function PartnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isChunkError] = useState(() => isChunkLoadError(error));

  useEffect(() => {
    console.error("Partner page error:", error);
  }, [error]);

  useEffect(() => {
    if (!isChunkError) return;
    const key = "chunk-reload-ts";
    const lastReload = sessionStorage.getItem(key);
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10_000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }, [isChunkError]);

  if (isChunkError) {
    return (
      <div className="error-boundary">
        <div className="error-boundary-content">
          <h2 className="error-boundary-title">Update available</h2>
          <p className="error-boundary-message">
            A newer version of this page is available. Please reload to continue.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="error-boundary">
      <div className="error-boundary-content">
        <h2 className="error-boundary-title">Something went wrong</h2>
        <p className="error-boundary-message">
          An error occurred while loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="error-boundary-digest">Error ID: {error.digest}</p>
        )}
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
