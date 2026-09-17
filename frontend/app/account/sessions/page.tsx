"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SessionManager } from "@/features/profile/components/session-manager";

export default function SessionsPage() {
  return <RoleGuard roles={["DRIVER", "PROVIDER", "PARKING_OWNER", "MANAGER", "GUARD", "ADMIN"]}><main className="min-h-screen bg-[#f7f8fb] px-4 py-10"><div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-3xl font-extrabold">Active sessions</h1><p className="mt-2 text-sm text-muted-foreground">Review and revoke devices signed in to your account.</p></div><SessionManager /></div></main></RoleGuard>;
}
