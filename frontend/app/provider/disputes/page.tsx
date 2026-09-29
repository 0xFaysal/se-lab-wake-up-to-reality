import { ProviderPage, ProviderPageHeader } from "@/components/provider/provider-page";
import { DisputeHistory } from "@/features/marketplace/components/dispute-history";

export default function ProviderDisputesPage() {
  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Disputes"
        description="Booking disputes visible within your account scope."
        breadcrumbs={[{ label: "Reputation & Support" }, { label: "Disputes" }]}
      />
      <DisputeHistory scope="provider" hideHeader />
    </ProviderPage>
  );
}
