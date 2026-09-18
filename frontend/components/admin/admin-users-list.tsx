"use client";

import Link from "next/link";
import { type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { UserRole } from "@/lib/api/api-types";

const roleTitles: Partial<Record<UserRole, string>> = {
  DRIVER: "Drivers",
  PROVIDER: "Providers",
  MANAGER: "Managers",
  GUARD: "Guards",
};

export function AdminUsersList({ role, basePath = "/admin/users" }: { role?: UserRole; basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get("search") || undefined;
  const status = params.get("status") || undefined;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const title = role ? roleTitles[role] ?? "Users" : "Users";
  const query = useQuery({
    queryKey: ["admin", "users", { role, search, status, page }],
    queryFn: () => adminOperationsApi.users({ page, limit: 20, role, search, status }),
  });

  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`${basePath}${next.size ? `?${next.toString()}` : ""}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("search") ?? "").trim();
    navigate({ search: value, page: "1" });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="People"
        title={title}
        description="Identity, verification, role, session and account-risk oversight."
        action={<Link href="/admin/users/new" className="inline-flex h-10 items-center gap-2 bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900"><Plus className="size-4" />Create user</Link>}
      />
      <form onSubmit={submit} className="flex max-w-3xl flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input name="search" defaultValue={search} className="pl-9" placeholder="Search name, email or phone" /></div>
        <select className="h-10 border bg-white px-3 text-sm" value={status ?? ""} onChange={(event) => navigate({ status: event.target.value, page: "1" })}>
          <option value="">All statuses</option><option value="PENDING">Pending</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="BLOCKED">Blocked</option>
        </select>
        <Button type="submit">Search</Button>
      </form>
      {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{getApiErrorMessage(query.error)}</div> : query.data.users.length === 0 ? <AdminEmptyState title="No matching accounts" description="Try changing the status or search filters." /> : (
        <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[820px] text-left"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{query.data.users.map((user) => <tr key={user.id} className="hover:bg-slate-50"><td className="px-4 py-3"><strong className="block text-sm">{user.fullName}</strong><span className="block text-xs text-slate-500">{user.email}</span><span className="block text-[11px] text-slate-400">{user.phone}</span></td><td className="px-4 py-3 text-xs">{user.roles.join(" · ")}</td><td className="px-4 py-3 text-xs"><span className={user.emailVerified ? "text-emerald-700" : "text-amber-700"}>Email {user.emailVerified ? "verified" : "pending"}</span><br /><span className="text-slate-500">Phone {user.phoneVerified ? "verified" : "optional"}</span></td><td className="px-4 py-3 text-xs text-slate-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-BD") : "Never"}</td><td className="px-4 py-3"><AdminStatus value={user.status} /></td><td className="px-4 py-3 text-right"><Link href={`/admin/users/${user.id}`} className="text-xs font-bold text-emerald-800">Open</Link></td></tr>)}</tbody></table></div>
      )}
      {query.data && query.data.pagination.totalPages > 1 && <div className="flex items-center justify-between text-xs text-slate-500"><span>{query.data.pagination.total.toLocaleString("en-BD")} accounts</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) })}><ChevronLeft className="size-4" />Previous</Button><span>Page {page} of {query.data.pagination.totalPages}</span><Button variant="outline" size="sm" disabled={page >= query.data.pagination.totalPages} onClick={() => navigate({ page: String(page + 1) })}>Next<ChevronRight className="size-4" /></Button></div></div>}
    </div>
  );
}
