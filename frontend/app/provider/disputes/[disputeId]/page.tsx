import { DisputeDetail } from "@/features/marketplace/components/dispute-history";

export default async function OwnerDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  return <DisputeDetail scope="provider" disputeId={disputeId} />;
}
