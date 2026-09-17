import { Metadata } from "next";
import { AddManagerWizard } from "@/features/owner/managers/add-manager-wizard";

export const metadata: Metadata = {
  title: "Add Manager | Owner Portal | ParkEase BD",
  description: "Invite and delegate parking operations to a new property manager.",
};

export default function AddManagerPage() {
  return <AddManagerWizard />;
}
