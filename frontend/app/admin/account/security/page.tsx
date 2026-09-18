"use client";

import { Shield, ShieldCheck, Lock, Activity } from "lucide-react";
import { Admin2FASetup } from "@/components/admin/admin-2fa-setup";
import { AdminSessionManager } from "@/components/admin/admin-session-manager";
import { SecuritySettingsCard } from "@/features/profile/components/security-settings-card";

export default function AdminSecurityPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      {/* ─── Page Header ──────────────────────────────────────────── */}
      <header className="border-b border-slate-200 pb-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#064E3B] text-white shadow-sm">
            <Shield className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl font-heading">
              Admin Security Center
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Harden your admin account with 2FA, session management, and
              password controls.
            </p>
          </div>
        </div>

        {/* Quick security status badges */}
        <div className="flex flex-wrap gap-2">
          <SecurityStatusBadge
            icon={ShieldCheck}
            label="Role"
            value="Super Admin"
            tone="emerald"
          />
          <SecurityStatusBadge
            icon={Lock}
            label="Password"
            value="Set"
            tone="emerald"
          />
          <SecurityStatusBadge
            icon={Activity}
            label="Last Login"
            value="Just now"
            tone="blue"
          />
        </div>
      </header>

      {/* ─── Two-Factor Authentication ─────────────────────────── */}
      <section aria-labelledby="2fa-section">
        <h2 id="2fa-section" className="sr-only">
          Two-Factor Authentication
        </h2>
        <Admin2FASetup />
      </section>

      {/* ─── Password & Basic Security ─────────────────────────── */}
      <section aria-labelledby="password-section">
        <h2 id="password-section" className="sr-only">
          Password & Account Security
        </h2>
        <SecuritySettingsCard sessionsHref="/admin/account/sessions" />
      </section>

      {/* ─── Session Management ────────────────────────────────── */}
      <section aria-labelledby="sessions-section">
        <h2 id="sessions-section" className="sr-only">
          Active Sessions
        </h2>
        <AdminSessionManager />
      </section>

      {/* ─── Security Policy Footer ────────────────────────────── */}
      <footer className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-700">DevSecOps Notice:</strong> All
        administrative actions are logged in the platform audit trail. Session
        revocations, 2FA changes, and password resets are recorded with
        timestamps, IP addresses, and user-agent signatures. Tampering with
        audit logs is a violation of the ParkEase BD security policy.
      </footer>
    </div>
  );
}

// ─── Helper Component ────────────────────────────────────────────────────────

function SecurityStatusBadge({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone: "emerald" | "blue" | "amber" | "red";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${colors[tone]}`}
    >
      <Icon className="size-3" />
      {label}: {value}
    </span>
  );
}
