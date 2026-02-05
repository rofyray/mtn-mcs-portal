"use client";

import { SessionProvider } from "next-auth/react";

import { ToastProvider } from "@/components/toast";
import { AdminProvider } from "@/contexts/admin-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminProvider>
        <ToastProvider>{children}</ToastProvider>
      </AdminProvider>
    </SessionProvider>
  );
}
