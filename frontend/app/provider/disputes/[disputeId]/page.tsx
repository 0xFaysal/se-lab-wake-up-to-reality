import { ProviderPage, ProviderPageHeader } from "@/components/provider/provider-page";
import { DisputeDetail } from "@/features/marketplace/components/dispute-history";

export default async function ProviderDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Dispute detail"
        description="Review dispute details, timeline, and submitted evidence."
        breadcrumbs={[
          { label: "Reputation & Support" },
          { label: "Disputes", href: "/provider/disputes" },
          { label: disputeId },
        ]}
      />
      <DisputeDetail scope="provider" disputeId={disputeId} hideHeader />
    </ProviderPage>
  );
}
