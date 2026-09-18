"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { LogoutButton } from "@/components/auth/logout-button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth-api";
import { getApiErrorMessage } from "@/lib/api/api-error";

export function AccountActionsCard() {
  const [pending, setPending] = useState(false); const client = useQueryClient(); const router = useRouter();
  async function logoutAll() { if (pending) return; setPending(true); try { await authApi.logoutAll(); client.clear(); router.replace("/login"); router.refresh(); } catch (error) { toast.error(getApiErrorMessage(error)); setPending(false); } }
  return <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">Account sessions</h3><p className="mt-1 text-xs text-muted-foreground">Sign out here or revoke access from every device.</p></div><div className="flex flex-wrap gap-2"><LogoutButton /><AlertDialog><AlertDialogTrigger render={<Button variant="destructive" />}><LogOut className="size-4" />Sign out everywhere</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sign out from every device?</AlertDialogTitle><AlertDialogDescription>All active sessions, including this one, will be revoked. You will need to sign in again.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending} onClick={logoutAll}>{pending ? <Loader2 className="size-4 animate-spin" /> : "Sign out all"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></div>;
}
