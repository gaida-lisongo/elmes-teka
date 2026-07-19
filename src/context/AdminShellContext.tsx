"use client";

import { createContext, useContext } from "react";

import type { AdminShellContextValue } from "@/types/admin-shell";

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function AdminShellProvider({
  value,
  children,
}: {
  value: AdminShellContextValue;
  children: React.ReactNode;
}) {
  return (
    <AdminShellContext.Provider value={value}>
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell(): AdminShellContextValue {
  const value = useContext(AdminShellContext);

  if (!value) {
    throw new Error("useAdminShell doit etre utilise dans AdminShellProvider.");
  }

  return value;
}
