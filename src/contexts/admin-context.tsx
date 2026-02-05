"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";

type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
};

type AdminContextValue = {
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";

  const fetchAdmin = useCallback(async () => {
    if (!isAdminRoute) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/me");
      if (!response.ok) {
        setAdmin(null);
        return;
      }
      const data = await response.json();
      setAdmin(data.admin ?? null);
    } catch {
      setError("Failed to fetch admin data");
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAdminRoute]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  const value = useMemo(
    () => ({
      admin,
      isLoading,
      error,
      refetch: fetchAdmin,
    }),
    [admin, isLoading, error, fetchAdmin]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

export function useAdminRole() {
  const { admin, isLoading } = useAdmin();
  return {
    role: admin?.role ?? null,
    isLoading,
    isFullAccess: admin?.role === "FULL",
    isManager: admin?.role === "MANAGER",
    isCoordinator: admin?.role === "COORDINATOR",
    isSeniorManager: admin?.role === "SENIOR_MANAGER",
  };
}
