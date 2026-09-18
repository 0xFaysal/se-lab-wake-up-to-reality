"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", href: "/manager/dashboard", icon: LayoutGrid },
  { label: "Delegated Properties", href: "/manager/properties", icon: Building2 },
];

export function ManagerSidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  return <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-white"><div className="flex h-16 items-center gap-3 border-b px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-[#064E3B] font-bold text-white">P</span><span><strong className="block text-sm">ParkEase BD</strong><small className="text-slate-500">Manager Portal</small></span></div><nav className="space-y-1 p-4">{items.map((item) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={item.href} href={item.href} onClick={onCloseMobile} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold", active ? "bg-emerald-50 text-[#064E3B]" : "text-slate-600 hover:bg-slate-50")}><Icon className="size-4" />{item.label}</Link>; })}</nav><p className="mt-auto border-t p-4 text-xs text-slate-500">All actions remain limited by the permissions and resources in your active server delegation.</p></aside>;
}
