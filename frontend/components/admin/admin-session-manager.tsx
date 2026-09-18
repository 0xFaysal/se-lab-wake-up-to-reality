"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Laptop,
  Smartphone,
  Loader2,
  LogOut,
  ShieldCheck,
  Trash2,
  Globe,
  Clock,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi } from "@/lib/api/auth-api";
import type { SessionDto } from "@/lib/api/api-types";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { auditLogger } from "@/lib/security/audit-logger";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseUserAgent(ua: string): {
  browser: string;
  os: string;
  isMobile: boolean;
} {
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edge|edg/i.test(ua)) browser = "Edge";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os|macintosh/i.test(ua)) os = isMobile ? "iOS" : "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, os, isMobile };
}

function getDeviceIcon(isMobile: boolean) {
  return isMobile ? Smartphone : Laptop;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminSessionManager() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [target, setTarget] = useState<SessionDto | null>(null);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: queryKeys.auth.sessions,
    queryFn: async () => (await authApi.sessions()).sessions,
  });

  const revokeMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: async () => {
      // Log session revocation to audit trail
      auditLogger.log({
        actionType: "DELETE",
        actionDescription: `Revoked session: ${target?.userAgent?.substring(0, 50) || "Unknown"}`,
        resource: "SESSION",
        resourceId: target?.id,
        managerId: "current-admin",
        managerName: "Super Admin",
        status: "SUCCESS",
        metadata: {
          sessionId: target?.id,
          wasCurrent: target?.current,
          deviceInfo: target?.userAgent,
        },
      });

      const wasCurrent = target?.current;
      setTarget(null);

      if (wasCurrent) {
        queryClient.clear();
        router.replace("/login");
        router.refresh();
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.sessions,
      });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: async () => {
      // Log bulk session revocation to audit trail
      auditLogger.log({
        actionType: "DELETE",
        actionDescription: "Revoked all other sessions (bulk security action)",
        resource: "SESSION",
        resourceId: null,
        managerId: "current-admin",
        managerName: "Super Admin",
        status: "SUCCESS",
        metadata: {
          totalSessions: sessionsQuery.data?.length ?? 0,
          action: "REVOKE_ALL_OTHERS",
        },
      });

      setRevokeAllDialogOpen(false);
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });

  const handleRevokeAll = useCallback(() => {
    setRevokeAllDialogOpen(true);
  }, []);

  // ─── Loading / Error states ────────────────────────────────────────────
  if (sessionsQuery.isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-[#064E3B]" />
          <span className="text-sm text-muted-foreground">
            Loading active sessions…
          </span>
        </div>
      </div>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {getApiErrorMessage(sessionsQuery.error)}
      </div>
    );
  }

  const sessions = sessionsQuery.data ?? [];
  const currentSession = sessions.find((s) => s.current);
  const otherSessions = sessions.filter((s) => !s.current);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
              <Monitor className="size-5 text-[#064E3B]" />
              Active Sessions
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review where your admin account is signed in. Revoke any
              session you don&apos;t recognize.
            </p>
          </div>
          {otherSessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAll}
              disabled={revokeAllMutation.isPending}
              className="shrink-0 text-xs font-bold text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Revoke All Others
            </Button>
          )}
        </div>

        {sessions.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No active sessions found for this admin account.
          </div>
        )}

        {/* Current Session */}
        {currentSession && (
          <SessionCard
            session={currentSession}
            isCurrent
            onRevoke={() => setTarget(currentSession)}
            isRevoking={revokeMutation.isPending}
          />
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Other Devices ({otherSessions.length})
            </h4>
            {otherSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isCurrent={false}
                onRevoke={() => setTarget(session)}
                isRevoking={revokeMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Security tip */}
        <div className="rounded-xl bg-blue-50/70 border border-blue-100/90 p-3.5 flex items-start gap-3 text-xs text-blue-950">
          <AlertTriangle className="size-4 text-blue-700 shrink-0 mt-0.5" />
          <p className="text-blue-900 leading-relaxed">
            If you see an unfamiliar device or location, revoke the session
            immediately and change your password. Consider enabling 2FA for
            enhanced security.
          </p>
        </div>

        {/* Error display */}
        {revokeMutation.isError && (
          <p role="alert" className="text-sm text-red-700 font-medium">
            {getApiErrorMessage(revokeMutation.error)}
          </p>
        )}
      </div>

      {/* ─── Single Revoke Dialog ──────────────────────────────────── */}
      <AlertDialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open && !revokeMutation.isPending) setTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.current
                ? "This is your current session. You will be signed out immediately and redirected to the login page."
                : "This device will lose access and must sign in again. This action is logged in the audit trail."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={revokeMutation.isPending}
              onClick={() => target && revokeMutation.mutate(target.id)}
            >
              {revokeMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <LogOut className="size-4 mr-2" />
              )}
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Revoke All Dialog ──────────────────────────────────── */}
      <AlertDialog
        open={revokeAllDialogOpen}
        onOpenChange={(open) => {
          if (!open && !revokeAllMutation.isPending)
            setRevokeAllDialogOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              All devices except your current session will be signed out.
              You will also be signed out and redirected to the login page.
              This action is recorded in the security audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeAllMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={revokeAllMutation.isPending}
              onClick={() => revokeAllMutation.mutate()}
            >
              {revokeAllMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Revoke All & Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Session Card Sub-component ──────────────────────────────────────────────

function SessionCard({
  session,
  isCurrent,
  onRevoke,
  isRevoking,
}: {
  session: SessionDto;
  isCurrent: boolean;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const { browser, os, isMobile } = parseUserAgent(session.userAgent);
  const DeviceIcon = getDeviceIcon(isMobile);

  return (
    <article
      className={cn(
        "flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center transition-colors",
        isCurrent
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            isCurrent
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          <DeviceIcon className="size-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-bold text-foreground">
              {browser} on {os}
            </h2>
            {isCurrent && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold px-1.5 py-0">
                <ShieldCheck className="size-3 mr-0.5" />
                Current
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Signed in {getRelativeTime(session.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="size-3" />
              Expires {formatDateTime(session.expiresAt)}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={isRevoking}
        onClick={onRevoke}
        className={cn(
          "shrink-0 text-xs font-bold h-8",
          isCurrent
            ? "text-amber-700 border-amber-200 hover:bg-amber-50"
            : "text-red-700 border-red-200 hover:bg-red-50"
        )}
      >
        <LogOut className="size-3.5 mr-1.5" />
        Revoke
      </Button>
    </article>
  );
}
