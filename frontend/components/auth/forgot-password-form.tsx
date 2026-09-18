"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth-api";
import { getApiErrorMessage } from "@/lib/api/api-error";

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending) return;
    const value = identifier.trim();
    if (value.length < 3) { setError("Enter your registered email address or Bangladesh phone number."); return; }
    setPending(true); setError("");
    try { await authApi.requestPasswordReset(value); setSent(true); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setPending(false); }
  }

  if (sent) return <div className="space-y-6 text-center" role="status"><CheckCircle2 className="mx-auto size-14 text-emerald-700" /><div><h1 className="text-2xl font-extrabold">Check your email</h1><p className="mt-2 text-sm text-muted-foreground">If an account exists for that identifier, password-reset instructions have been sent. The same response is shown for every account.</p></div><Button variant="outline" onClick={() => setSent(false)}>Try another identifier</Button><Link href="/login" className="block text-sm font-bold text-primary">Back to sign in</Link></div>;

  return <div className="space-y-6"><div><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><KeyRound className="size-4" />Password recovery</span><h1 className="mt-3 text-3xl font-extrabold">Reset your password</h1><p className="mt-2 text-sm text-muted-foreground">Enter the email address or Bangladesh phone number registered to your account.</p></div><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="reset-identifier">Email or phone</Label><Input id="reset-identifier" autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="name@example.com or 017XXXXXXXX" /></div>{error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}<Button type="submit" className="w-full bg-[#064E3B]" disabled={pending} aria-busy={pending}>{pending ? <><Loader2 className="size-4 animate-spin" />Sending…</> : "Send reset link"}</Button></form><Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Back to sign in</Link></div>;
}
