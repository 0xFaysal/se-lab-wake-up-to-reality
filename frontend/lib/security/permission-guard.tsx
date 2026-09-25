"use client";

import React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { AppPermission } from "./types";
import { usePermissions } from "./use-permissions";

export interface PermissionGuardProps {
  requiredPermission: AppPermission | AppPermission[];
  fallbackMode?: "disable" | "hide";
  fallbackMessage?: string;
  fallbackComponent?: React.ReactNode;
  requireAll?: boolean; // If multiple permissions, require all (true) or any (false). Default false.
  children: React.ReactNode;
  className?: string;
}

/**
 * <PermissionGuard />
 * Wrap interactive controls or sections to enforce granular Manager RBAC.
 * - fallbackMode="disable": Renders children with reduced opacity, pointer-events disabled, and a lock tooltip badge.
 * - fallbackMode="hide": Completely omits children from DOM when permission is lacking.
 */
export function PermissionGuard({
  requiredPermission,
  fallbackMode = "disable",
  fallbackMessage,
  fallbackComponent,
  requireAll = false,
  children,
  className = "",
}: PermissionGuardProps) {
  const { hasAllPermissions, hasAnyPermission } = usePermissions();

  const permsArray = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  const hasAccess = requireAll
    ? hasAllPermissions(permsArray)
    : hasAnyPermission(permsArray);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback Mode: Hide
  if (fallbackMode === "hide") {
    return fallbackComponent ? <>{fallbackComponent}</> : null;
  }

  // Fallback Mode: Disable with Lock Icon & Tooltip
  const defaultMsg =
    fallbackMessage ||
    `Restricted: Requires '${permsArray.join(" or ")}' scope. Contact Property Owner.`;

  return (
    <div
      className={`relative group inline-block ${className}`}
      title={defaultMsg}
      aria-disabled="true"
    >
      {/* Visual lock overlay & banner */}
      <div className="opacity-45 pointer-events-none select-none grayscale-30 transition-opacity">
        {children}
      </div>

      {/* Floating Lock Badge Indicator */}
      <div className="absolute -top-2 -right-2 z-20 pointer-events-auto">
        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
          <Lock className="size-2.5 text-amber-600 shrink-0" />
          <span className="hidden sm:inline">Restricted</span>
        </div>
      </div>

      {/* Hover Tooltip (Accessible & CSS based) */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 min-w-[200px] max-w-[260px]">
        <div className="bg-slate-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-xl text-center border border-slate-700 leading-tight">
          <div className="flex items-center justify-center gap-1 text-amber-400 font-bold mb-0.5">
            <ShieldAlert className="size-3 shrink-0" />
            <span>Scope Restricted</span>
          </div>
          <p className="text-slate-300 text-[10px]">{defaultMsg}</p>
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

/**
 * Higher-Order Component (HOC) version of PermissionGuard
 */
export function withPermissionGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: AppPermission | AppPermission[],
  fallbackMode: "disable" | "hide" = "disable",
  fallbackMessage?: string
) {
  const ComponentWithGuard = (props: P) => {
    return (
      <PermissionGuard
        requiredPermission={requiredPermission}
        fallbackMode={fallbackMode}
        fallbackMessage={fallbackMessage}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };

  ComponentWithGuard.displayName = `withPermissionGuard(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithGuard;
}
