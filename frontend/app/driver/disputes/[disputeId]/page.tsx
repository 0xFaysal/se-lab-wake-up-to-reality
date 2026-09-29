import { DisputeDetail } from "@/features/marketplace/components/dispute-history";

export default async function DriverDisputeDetailPage({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <DisputeDetail scope="driver" disputeId={disputeId} />
    </div>
  );
}
