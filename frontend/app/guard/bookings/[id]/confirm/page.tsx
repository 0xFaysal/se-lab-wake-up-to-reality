import { redirect } from "next/navigation";

export default function GuardConfirmCheckinPage() {
  redirect("/guard/scan");
}
