import { DisputeDetail } from "@/features/marketplace/components/dispute-history";

export default async function DriverDisputeDetailPage({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params;
  return <div className="mx-auto max-w-5xl px-4"><DisputeDetail scope="driver" disputeId={disputeId} /></div>;
}
