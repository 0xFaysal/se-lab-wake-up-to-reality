import { Metadata } from "next";
import { ManagerDetailsView } from "@/features/owner/managers/manager-details-view";
import { MOCK_OWNER_MANAGERS } from "@/lib/data/mock-owner-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const manager = MOCK_OWNER_MANAGERS.find((m) => m.id === id);
  return {
    title: manager
      ? `${manager.name} - Manager Overview | Owner Portal | ParkEase BD`
      : "Manager Overview | Owner Portal | ParkEase BD",
    description:
      "Detailed operational overview, property delegations, and audit logs for property manager.",
  };
}

export default async function ManagerDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <ManagerDetailsView managerId={id} />;
}
