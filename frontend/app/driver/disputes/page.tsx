import { DisputeHistory } from "@/features/marketplace/components/dispute-history";

export default function DriverDisputesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <DisputeHistory scope="driver" />
    </div>
  );
}
