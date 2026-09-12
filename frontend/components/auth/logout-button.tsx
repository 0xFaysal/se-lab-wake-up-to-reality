"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth-api";
import { getApiErrorMessage } from "@/lib/api/api-error";

export function LogoutButton({ className, label = "Sign Out" }: { className?: string; label?: string }) {
  const [pending, setPending] = useState(false); const client = useQueryClient(); const router = useRouter();
  async function logout() { if (pending) return; setPending(true); try { await authApi.logout(); client.clear(); router.replace("/login"); router.refresh(); } catch (error) { toast.error(getApiErrorMessage(error)); setPending(false); } }
  return <Button type="button" variant="outline" className={className} disabled={pending} onClick={logout} aria-busy={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}{label}</Button>;
}
