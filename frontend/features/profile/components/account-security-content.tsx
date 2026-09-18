"use client";

import { AccountActionsCard } from "@/features/profile/components/account-actions-card";
import { SecuritySettingsCard } from "@/features/profile/components/security-settings-card";

export function AccountSecurityContent({
  sessionsHref,
}: {
  sessionsHref: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 sm:px-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          Account security
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Update your password and protect access to your ParkEase BD account.
        </p>
      </header>
      <SecuritySettingsCard sessionsHref={sessionsHref} />
      <AccountActionsCard />
    </div>
  );
}
