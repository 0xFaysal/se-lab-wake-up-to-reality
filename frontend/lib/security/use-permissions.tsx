"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { AppPermission, NormalizedPermissions, normalizePermissions } from "./types";
import { MOCK_OWNER_MANAGERS, OwnerManager } from "@/lib/data/mock-owner-data";
import { useCurrentUser } from "@/hooks/use-current-user";

export interface PermissionsContextValue {
  permissions: NormalizedPermissions;
  rawPermissions: Record<string, boolean>;
  isManager: boolean;
  isOwner: boolean;
  manager: OwnerManager | null;
  activePropertyId: string | null;
  setActivePropertyId: (id: string | null) => void;
  hasPermission: (permission: AppPermission) => boolean;
  hasAnyPermission: (permissions: AppPermission[]) => boolean;
  hasAllPermissions: (permissions: AppPermission[]) => boolean;
  updatePermissionOverride: (key: AppPermission, value: boolean) => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export interface PermissionsProviderProps {
  children: React.ReactNode;
  initialManagerId?: string;
  initialPropertyId?: string;
  initialPermissions?: Partial<NormalizedPermissions>;
  allowFinancialAccess?: boolean;
  enforceManagerScope?: boolean;
}

export function PermissionsProvider({
  children,
  initialManagerId = "mgr-1",
  initialPropertyId = "prop-gulshan-1",
  initialPermissions,
  allowFinancialAccess = false,
  enforceManagerScope = false,
}: PermissionsProviderProps) {
  const { data: user } = useCurrentUser();

  // Find active manager profile (fallback to Rahim Uddin)
  const currentManager: OwnerManager = useMemo(() => {
    return (
      MOCK_OWNER_MANAGERS.find((m) => m.id === initialManagerId) ||
      MOCK_OWNER_MANAGERS[0]
    );
  }, [initialManagerId]);

  const [activePropertyId, setActivePropertyId] = useState<string | null>(initialPropertyId);

  // Dynamic overrides state for testing or live delegation edits
  const [overrides, setOverrides] = useState<Partial<NormalizedPermissions>>({});

  // Computed normalized permissions
  const permissions: NormalizedPermissions = useMemo(() => {
    const base = normalizePermissions(currentManager.permissions, allowFinancialAccess);
    return {
      ...base,
      ...(initialPermissions || {}),
      ...overrides,
    };
  }, [currentManager.permissions, allowFinancialAccess, initialPermissions, overrides]);

  const isOwner = Boolean(user?.roles?.includes("PROVIDER") || user?.roles?.includes("PARKING_OWNER"));
  const isManager = Boolean(user?.roles?.includes("MANAGER") || !isOwner);

  const hasPermission = (permission: AppPermission): boolean => {
    // When enforceManagerScope is true, strictly respect the manager permissions
    if (!enforceManagerScope && isOwner && !isManager) return true;
    return Boolean(permissions[permission]);
  };

  const hasAnyPermission = (perms: AppPermission[]): boolean => {
    if (!enforceManagerScope && isOwner && !isManager) return true;
    return perms.some((p) => Boolean(permissions[p]));
  };

  const hasAllPermissions = (perms: AppPermission[]): boolean => {
    if (!enforceManagerScope && isOwner && !isManager) return true;
    return perms.every((p) => Boolean(permissions[p]));
  };

  const updatePermissionOverride = (key: AppPermission, value: boolean) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const contextValue: PermissionsContextValue = {
    permissions,
    rawPermissions: permissions,
    isManager,
    isOwner,
    manager: currentManager,
    activePropertyId,
    setActivePropertyId,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    updatePermissionOverride,
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook to access manager permissions and capability checks
 */
export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext);

  if (context) {
    return context;
  }

  // Standalone fallback when used outside PermissionsProvider
  const defaultManager = MOCK_OWNER_MANAGERS[0];
  const defaultPermissions = normalizePermissions(defaultManager.permissions, false);

  return {
    permissions: defaultPermissions,
    rawPermissions: defaultPermissions,
    isManager: true,
    isOwner: false,
    manager: defaultManager,
    activePropertyId: "prop-gulshan-1",
    setActivePropertyId: () => {},
    hasPermission: (permission: AppPermission) => Boolean(defaultPermissions[permission]),
    hasAnyPermission: (perms: AppPermission[]) => perms.some((p) => Boolean(defaultPermissions[p])),
    hasAllPermissions: (perms: AppPermission[]) => perms.every((p) => Boolean(defaultPermissions[p])),
    updatePermissionOverride: () => {},
  };
}
