"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

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
