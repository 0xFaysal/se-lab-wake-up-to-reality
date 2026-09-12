import { redirect } from "next/navigation";

export default function LegacyWizardStepLayout() {
  redirect("/owner/properties/new");
}
