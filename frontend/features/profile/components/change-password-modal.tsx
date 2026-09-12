"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/lib/api/user-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { strongPasswordSchema } from "@/lib/validations/auth";
import { queryKeys } from "@/lib/query-keys";

export function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const client = useQueryClient(); const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  function close() { if (pending) return; setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setError(""); onClose(); }
  async function submit(event: React.FormEvent) { event.preventDefault(); if (pending) return; const parsed = strongPasswordSchema.safeParse(newPassword); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Choose a stronger password."); return; } if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; } setPending(true); setError(""); try { await userApi.changePassword({ currentPassword, newPassword }); await client.invalidateQueries({ queryKey: queryKeys.auth.me }); toast.success("Password changed. Other sessions were revoked."); closeAfterSuccess(); } catch (requestError) { setError(getApiErrorMessage(requestError)); setPending(false); } }
  function closeAfterSuccess() { setPending(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); onClose(); }
  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="size-4" />Change password</DialogTitle><DialogDescription>Changing your password revokes all previous sessions and keeps this device signed in.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div><div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div><div><Label htmlFor="confirm-new-password">Confirm new password</Label><Input id="confirm-new-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div><p className="text-xs text-muted-foreground">Minimum 12 characters with uppercase, lowercase, number, special character, and no spaces.</p>{error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={close} disabled={pending}>Cancel</Button><Button type="submit" className="bg-[#064E3B]" disabled={pending} aria-busy={pending}>{pending ? <><Loader2 className="size-4 animate-spin" />Updating…</> : "Update password"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
