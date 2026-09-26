"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProviderPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function ProviderPageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}: {
  title: string;
  description: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 pb-5">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Link href="/provider/dashboard" className="hover:text-slate-900">Provider Portal</Link>
          {breadcrumbs.map((item) => (
            <span key={`${item.label}-${item.href ?? "current"}`} className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              {item.href ? <Link href={item.href} className="hover:text-slate-900">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function PageSkeleton({ label = "Loading" }: { label?: string }) {
  return <div className="rounded-lg border bg-white px-6 py-14 text-center" aria-busy="true"><Loader2 className="mx-auto size-6 animate-spin text-emerald-700" /><p className="mt-3 text-sm text-slate-600">{label}</p></div>;
}

export function PageErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center"><AlertTriangle className="mx-auto size-7 text-red-700" /><p role="alert" className="mt-3 text-sm font-medium text-red-800">{message}</p>{retry && <Button className="mt-4" variant="outline" onClick={retry}><RefreshCw className="size-4" />Retry</Button>}</div>;
}

export function PageEmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return <div className="rounded-lg border border-dashed bg-white px-6 py-12 text-center"><Inbox className="mx-auto size-8 text-emerald-700" /><h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>{action && <Link href={action.href} className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#064E3B] px-4 text-sm font-semibold text-white">{action.label}<ArrowRight className="size-4" /></Link>}</div>;
}
