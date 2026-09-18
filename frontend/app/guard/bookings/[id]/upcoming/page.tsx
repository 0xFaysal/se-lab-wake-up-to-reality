import { redirect } from "next/navigation";

export default function GuardUpcomingBookingPage() {
  redirect("/guard/scan");
}
