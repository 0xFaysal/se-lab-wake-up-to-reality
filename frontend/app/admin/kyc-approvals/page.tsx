import type { Metadata } from "next";
import { KycApprovalsView } from "@/components/admin/kyc-approvals-view";

export const metadata: Metadata = {
  title: "Host KYC Approvals — ParkEase BD Admin",
  description: "Audit host national identity documents, trade licenses, and manage financial withdrawal authorization.",
};

export default function AdminKycApprovalsPage() {
  return <KycApprovalsView />;
}
