import Link from "next/link";
import { CreditCard, LockKeyhole, MonitorSmartphone } from "lucide-react";
import { ProviderPage, ProviderPageHeader } from "@/components/owner/provider-page";

export default function OwnerSettingsPage() {
  return <ProviderPage className="max-w-4xl"><ProviderPageHeader title="Provider settings" description="Manage account security and payout destinations." breadcrumbs={[{ label: "Account" }, { label: "Settings" }]} /><div className="grid gap-4 sm:grid-cols-2"><SettingLink href="/owner/account/security" icon={<LockKeyhole className="size-5" />} title="Security" description="Change your password or sign out from every device." /><SettingLink href="/owner/account/sessions" icon={<MonitorSmartphone className="size-5" />} title="Active sessions" description="Review and revoke individual login sessions." /><SettingLink href="/owner/settings/payout-methods" icon={<CreditCard className="size-5" />} title="Payout methods" description="Add and manage masked bank or mobile wallet destinations." /></div></ProviderPage>;
}

function SettingLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return <Link href={href} className="rounded-lg border bg-white p-5 hover:border-emerald-300 hover:bg-emerald-50/30"><span className="text-emerald-800">{icon}</span><h2 className="mt-3 font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></Link>;
}
