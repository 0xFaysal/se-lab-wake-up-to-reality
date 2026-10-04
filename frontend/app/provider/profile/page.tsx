"use client";
import Link from "next/link";
import { CreditCard, LockKeyhole, MonitorSmartphone } from "lucide-react";
import {
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { PersonalInfoCard } from "@/features/profile/components/personal-info-card";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function ProviderProfilePage() {
  const { data: user } = useCurrentUser();
  const initials = (user?.fullName ?? "Provider")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <ProviderPage className="max-w-5xl">
      <ProviderPageHeader
        title="Profile"
        description="Your account identity and verified contact information."
        breadcrumbs={[{ label: "Account" }, { label: "Profile" }]}
      />
      <div className="flex items-center gap-4 border-b pb-6">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-emerald-950 text-xl font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <h2 className="break-words font-semibold">
            {user?.fullName ?? "Loading account"}
          </h2>
          <p className="text-sm text-slate-500">Provider</p>
        </div>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <PersonalInfoCard protectUnsavedChanges />
        <nav aria-label="Account shortcuts" className="space-y-1 border-l pl-5">
          {[
            {
              href: "/provider/account/security",
              label: "Security",
              icon: LockKeyhole,
            },
            {
              href: "/provider/account/sessions",
              label: "Account sessions",
              icon: MonitorSmartphone,
            },
            {
              href: "/provider/settings/payout-methods",
              label: "Payout settings",
              icon: CreditCard,
            },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm hover:bg-white"
            >
              <Icon className="size-4 text-emerald-800" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </ProviderPage>
  );
}
