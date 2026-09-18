import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentMethodsPage() {
  return <div className="mx-auto max-w-2xl space-y-5 px-4"><h1 className="text-3xl font-extrabold">Payment methods</h1><section className="rounded-lg border bg-white p-8 text-center"><CreditCard className="mx-auto size-9 text-slate-500" /><h2 className="mt-3 font-bold">No saved payment methods</h2><p className="mt-2 text-sm text-slate-600">This academic release uses an explicit simulated payment flow. It does not store bKash, Nagad, or card credentials.</p><Link href="/driver/bookings"><Button className="mt-5">Open bookings</Button></Link></section></div>;
}
