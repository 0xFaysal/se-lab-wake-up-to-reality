import { redirect } from "next/navigation";

export default function NewPropertyIndexPage() {
  redirect("/owner/properties/new/step-1");
}
