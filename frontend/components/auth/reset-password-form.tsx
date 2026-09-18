"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { strongPasswordSchema } from "@/lib/validations/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) return <div className="space-y-4 text-center"><LockKeyhole className="mx-auto size-12 text-red-600" /><h1 className="text-2xl font-extrabold">Reset link is incomplete</h1><p className="text-sm text-muted-foreground">Request a new password-reset link to continue.</p><Button nativeButton={false} render={<Link href="/forgot-password" />}>Request a new link</Button></div>;

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending) return;
    const parsed = strongPasswordSchema.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Choose a stronger password."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setPending(true); setError("");
    try { await authApi.resetPassword(token, password); setSuccess(true); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setPending(false); }
  }

  if (success) return <div className="space-y-5 text-center" role="status"><CheckCircle2 className="mx-auto size-14 text-emerald-700" /><h1 className="text-2xl font-extrabold">Password reset successfully</h1><p className="text-sm text-muted-foreground">All previous sessions were revoked. Sign in again with your new password.</p><Button nativeButton={false} render={<Link href="/login" />} className="bg-[#064E3B]">Continue to sign in</Button></div>;

  return <div className="space-y-6"><div><h1 className="text-3xl font-extrabold">Choose a new password</h1><p className="mt-2 text-sm text-muted-foreground">Use 12–128 characters with uppercase, lowercase, number, special character, and no spaces.</p></div><form onSubmit={submit} className="space-y-4"><div><Label htmlFor="reset-password">New password</Label><Input id="reset-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div><Label htmlFor="reset-password-confirm">Confirm password</Label><Input id="reset-password-confirm" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>{error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}<Button type="submit" className="w-full bg-[#064E3B]" disabled={pending} aria-busy={pending}>{pending ? <><Loader2 className="size-4 animate-spin" />Resetting…</> : "Reset password"}</Button></form></div>;
}
