import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["ADMIN"]}><div className="min-h-screen bg-[#f7f8fb]"><header className="border-b bg-white"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/admin/properties/pending" className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#064E3B] text-white"><ShieldCheck className="size-5" /></span><span><strong className="block text-sm font-extrabold">ParkEase BD</strong><span className="block text-[11px] text-muted-foreground">Admin verification</span></span></Link><nav><Link href="/admin/properties/pending" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#064E3B] hover:bg-emerald-50"><Building2 className="size-4" />Pending properties</Link></nav></div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main></div></RoleGuard>;
}
