import { Metadata } from "next";
import { ManagerAssignmentsView } from "@/features/owner/managers/manager-assignments-view";
import { MOCK_OWNER_MANAGERS } from "@/lib/data/mock-owner-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const manager = MOCK_OWNER_MANAGERS.find((m) => m.id === id);
  return {
    title: manager
      ? `Manage Assignments - ${manager.name} | Owner Portal | ParkEase BD`
      : "Manage Property Assignments | Owner Portal | ParkEase BD",
    description:
      "Assign or unassign parking facilities to this manager and configure baseline operational delegations.",
  };
}

export default async function ManagerAssignmentsPage({ params }: PageProps) {
  const { id } = await params;
  return <ManagerAssignmentsView managerId={id} />;
}
