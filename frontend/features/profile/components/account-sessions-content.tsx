"use client";

import { SessionManager } from "@/features/profile/components/session-manager";

export function AccountSessionsContent() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          Active sessions
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review signed-in devices and revoke any session you no longer trust.
        </p>
      </header>
      <SessionManager />
    </div>
  );
}
