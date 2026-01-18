"use client";

import { useEffect } from "react";

import { useToast } from "@/components/toast";

type StoredToast = {
  title: string;
  message?: string;
  kind: "info" | "success" | "warning" | "error";
};

const toastStorageKey = "mtn:toast";

export default function PostAuthToast() {
  const { notify } = useToast();

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(toastStorageKey);
      if (!raw) {
        return;
      }
      const payload = JSON.parse(raw) as StoredToast;
      notify(payload);
      window.sessionStorage.removeItem(toastStorageKey);
    } catch {
      window.sessionStorage.removeItem(toastStorageKey);
    }
  }, [notify]);

  return null;
}

export function storeToast(payload: StoredToast) {
  window.sessionStorage.setItem(toastStorageKey, JSON.stringify(payload));
}
