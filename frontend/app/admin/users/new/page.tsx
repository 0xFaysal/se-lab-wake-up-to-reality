"use client";

import { type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { UserRole } from "@/lib/api/api-types";

type CreatableRole = Extract<UserRole, "DRIVER" | "PROVIDER" | "MANAGER" | "GUARD">;

export default function CreateAdminUserPage() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: adminOperationsApi.createUser,
    onSuccess: (result) => {
      toast.success("Pending account created and setup email sent");
      router.push(`/admin/users/${result.user.id}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      fullName: String(form.get("fullName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      role: String(form.get("role") ?? "DRIVER") as CreatableRole,
    });
  }

  return <div className="space-y-6">
    <AdminPageHeader eyebrow="People" title="Create user" description="Create a pending account and send a one-time secure password setup link." />
    <form onSubmit={submit} className="max-w-2xl space-y-5 border border-slate-200 bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">Display name<Input name="fullName" minLength={2} maxLength={120} required autoComplete="name" /></label>
        <label className="space-y-1.5 text-sm font-semibold">Email<Input name="email" type="email" maxLength={254} required autoComplete="off" /></label>
        <label className="space-y-1.5 text-sm font-semibold">Bangladesh phone<Input name="phone" type="tel" placeholder="01XXXXXXXXX" required autoComplete="off" /></label>
        <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">Role<select name="role" className="mt-1.5 h-10 w-full border border-slate-300 bg-white px-3 text-sm" defaultValue="DRIVER"><option value="DRIVER">Driver</option><option value="PROVIDER">Provider</option><option value="MANAGER">Manager</option><option value="GUARD">Guard</option></select></label>
      </div>
      <div className="flex gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p>No temporary password is generated or shown. The user receives a single-use, expiring setup link by email.</p></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Create and send setup</Button></div>
    </form>
  </div>;
}
