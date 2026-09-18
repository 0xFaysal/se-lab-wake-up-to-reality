import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
};

interface MobileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

function EmptyStateActionButton({ action, primary }: { action: EmptyStateAction; primary: boolean }) {
  const Icon = action.icon;
  const className = cn(
    buttonVariants({ variant: primary ? "default" : "outline" }),
    "h-11 w-full justify-center gap-2 sm:w-auto",
    primary && "bg-emerald-800 text-white hover:bg-emerald-900",
  );
  const content = <>{Icon && <Icon className="size-4" />}{action.label}</>;

  if (action.href) return <Link href={action.href} className={className}>{content}</Link>;
  return <button type="button" className={className} onClick={action.onClick}>{content}</button>;
}

export function MobileEmptyState({ icon: Icon, title, description, primaryAction, secondaryAction, className }: MobileEmptyStateProps) {
  return <div className={cn("mx-auto flex max-w-sm flex-col items-center px-5 py-10 text-center sm:py-14", className)}>
    <div className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
      <Icon className="size-6" />
    </div>
    <h2 className="mt-4 text-lg font-extrabold text-slate-950">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    {(primaryAction || secondaryAction) && <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      {primaryAction && <EmptyStateActionButton action={primaryAction} primary />}
      {secondaryAction && <EmptyStateActionButton action={secondaryAction} primary={false} />}
    </div>}
  </div>;
}
