"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getPrimaryRole } from "@/lib/auth-routing";
import type { UserRole } from "@/lib/api/api-types";

const portalAccountRoots: Partial<Record<UserRole, string>> = {
  ADMIN: "/admin/account",
  PROVIDER: "/owner/account",
  PARKING_OWNER: "/owner/account",
  MANAGER: "/manager/account",
  GUARD: "/guard/account",
  DRIVER: "/driver/account",
};

export function LegacyAccountRedirect({ page }: { page: "security" | "sessions" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending, isError } = useCurrentUser();

  useEffect(() => {
    if (isPending) return;
    if (isError || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const role = getPrimaryRole(user);
    const root = role ? portalAccountRoots[role] : undefined;
    router.replace(root ? `${root}/${page}` : "/");
  }, [isError, isPending, page, pathname, router, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="mx-auto size-7 animate-spin text-emerald-800" />
        <p className="mt-3 text-sm text-slate-600">
          Opening your account portal...
        </p>
      </div>
    </main>
  );
}
