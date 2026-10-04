import { AccountActionsCard } from "@/features/profile/components/account-actions-card";
import { SecuritySettingsCard } from "@/features/profile/components/security-settings-card";
import {
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";

export default function ProviderAccountSecurityPage() {
  return (
    <ProviderPage className="max-w-4xl">
      <ProviderPageHeader
        title="Account security"
        description="Protect access to your account and manage signed-in devices."
        breadcrumbs={[
          { label: "Settings", href: "/provider/settings" },
          { label: "Security" },
        ]}
      />
      <SecuritySettingsCard sessionsHref="/provider/account/sessions" />
      <AccountActionsCard />
    </ProviderPage>
  );
}
