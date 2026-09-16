"use client";

import React from "react";
import { OwnerDashboardComponent } from "@/features/owner/components/owner-dashboard-view";
import { usePermissions } from "@/lib/security/use-permissions";

/**
 * ManagerDashboardClient
 * Imports the Owner Dashboard component and injects the manager's RBAC permissions
 * object down as required by the DevSecOps architecture.
 */
export function ManagerDashboardClient() {
  const { permissions } = usePermissions();

  return (
    <OwnerDashboardComponent
      portalType="manager"
      baseRoute="/manager"
      permissions={permissions}
    />
  );
}
