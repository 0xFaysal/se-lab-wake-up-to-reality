"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { AccountActionsCard } from "@/features/profile/components/account-actions-card";
import { SecuritySettingsCard } from "@/features/profile/components/security-settings-card";

export default function AccountSecurityPage() {
  return <RoleGuard roles={["DRIVER", "PROVIDER", "PARKING_OWNER", "MANAGER", "GUARD", "ADMIN"]}><main className="min-h-screen bg-[#f7f8fb] px-4 py-10"><div className="mx-auto max-w-3xl space-y-5"><div><h1 className="text-3xl font-extrabold">Account security</h1><p className="mt-2 text-sm text-muted-foreground">Manage your password and authenticated sessions.</p></div><SecuritySettingsCard /><AccountActionsCard /></div></main></RoleGuard>;
}
