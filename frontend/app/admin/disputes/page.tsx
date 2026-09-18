import type { Metadata } from "next";
import { DisputeArbitrationView } from "@/components/admin/dispute-arbitration-view";

export const metadata: Metadata = {
  title: "Dispute Arbitration — ParkEase BD Admin",
  description: "Bilateral evidence evaluation and binding resolution for driver and host disputes.",
};

export default function AdminDisputesPage() {
  return <DisputeArbitrationView />;
}
