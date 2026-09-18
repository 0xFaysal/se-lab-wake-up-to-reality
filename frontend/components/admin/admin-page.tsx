import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-emerald-700">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function AdminEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AdminStatus({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone = ["ACTIVE", "VERIFIED", "CAPTURED", "SUCCEEDED", "PAID", "COMPLETED", "OPERATIONAL"].includes(normalized)
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : ["PENDING", "PENDING_VERIFICATION", "UNDER_REVIEW", "PAYMENT_PENDING", "CHECKOUT_REQUESTED"].includes(normalized)
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : ["FAILED", "REJECTED", "BLOCKED", "SUSPENDED", "DISPUTED", "UNAVAILABLE"].includes(normalized)
        ? "bg-red-50 text-red-800 ring-red-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return <span className={`inline-flex whitespace-nowrap px-2 py-1 text-[11px] font-bold ring-1 ring-inset ${tone}`}>{value.replaceAll("_", " ")}</span>;
}
