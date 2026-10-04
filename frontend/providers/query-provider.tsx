"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AUTH_EXPIRED_EVENT, subscribeClientSessionChanges } from "@/lib/api/api-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: (count, error) => !(error instanceof Error && "status" in error && (error as { status: number }).status >= 400 && (error as { status: number }).status < 500) && count < 2, refetchOnWindowFocus: false }, mutations: { retry: false } } }));
  useEffect(() => {
    const onExpired = () => {
      client.clear();
      const current = `${window.location.pathname}${window.location.search}`;
      const isPublic =
        current === "/" ||
        current === "/parking" ||
        current.startsWith("/parking/") ||
        current.startsWith("/about") ||
        current.startsWith("/how-it-works") ||
        current.startsWith("/safety") ||
        current.startsWith("/privacy") ||
        current.startsWith("/cancellation-policy");
      if (isPublic) return;
      const returnTo = current.startsWith("/login") ? "" : `?redirect=${encodeURIComponent(current)}`;
      window.location.assign(`/login${returnTo}`);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    const unsubscribe = subscribeClientSessionChanges(() => {
      client.clear();
      window.location.reload();
    });
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
      unsubscribe();
    };
  }, [client]);
  return <QueryClientProvider client={client}>{children}<Toaster richColors position="top-right" /></QueryClientProvider>;
}
