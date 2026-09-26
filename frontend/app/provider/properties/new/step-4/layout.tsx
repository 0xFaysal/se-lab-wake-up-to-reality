import { redirect } from "next/navigation";

export default function LegacyWizardStepLayout() {
  redirect("/provider/properties/new");
}
