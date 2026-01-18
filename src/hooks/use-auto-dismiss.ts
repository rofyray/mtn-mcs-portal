"use client";

import { useEffect } from "react";

export function useAutoDismiss(
  value: string | null,
  setter: React.Dispatch<React.SetStateAction<string | null>>,
  delay = 5000
) {
  useEffect(() => {
    if (!value) {
      return;
    }
    const id = window.setTimeout(() => {
      setter(null);
    }, delay);
    return () => window.clearTimeout(id);
  }, [delay, setter, value]);
}
