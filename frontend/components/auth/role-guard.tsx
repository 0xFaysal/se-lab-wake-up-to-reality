"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { destinationForUser, getRequiredAccountAction } from "@/lib/auth-routing";
import type { UserRole } from "@/lib/api/api-types";

export function RoleGuard({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending, isError } = useCurrentUser();
  const authorized = !!user && roles.some((role) => user.roles.includes(role));

  useEffect(() => {
    if (isPending) return;
    if (isError || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const action = getRequiredAccountAction(user);
    if (action.kind !== "READY") {
      router.replace(destinationForUser(user));
      return;
    }
    if (!authorized) router.replace(action.destination);
  }, [authorized, isError, isPending, pathname, router, user]);

  if (isPending || (!authorized && !isError)) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto size-7 animate-spin text-[#064E3B]" /><p className="mt-3 text-sm text-muted-foreground">Checking your secure session…</p></div></div>;
  }
  if (isError || !authorized) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><ShieldAlert className="mx-auto size-8 text-amber-600" /><p className="mt-3 text-sm font-semibold">Redirecting to the correct portal…</p></div></div>;
  }
  return children;
}
