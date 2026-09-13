import { Suspense } from "react";
import { Metadata } from "next";
import { ManagerPermissionsView } from "@/features/owner/managers/manager-permissions-view";
import { MOCK_OWNER_MANAGERS } from "@/lib/data/mock-owner-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const manager = MOCK_OWNER_MANAGERS.find((m) => m.id === id);
  return {
    title: manager
      ? `Manage Permissions - ${manager.name} | Owner Portal | ParkEase BD`
      : "Manage Permissions | Owner Portal | ParkEase BD",
    description:
      "Granular operational RBAC toggles, property delegations, and security governance for manager.",
  };
}

export default async function ManagerPermissionsPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center"><div className="size-8 border-3 border-[#064E3B] border-t-transparent rounded-full animate-spin" /></div>}>
      <ManagerPermissionsView managerId={id} />
    </Suspense>
  );
}
