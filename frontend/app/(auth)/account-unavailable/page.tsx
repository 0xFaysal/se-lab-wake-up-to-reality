import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function AccountUnavailablePage() { return <div className="space-y-6 text-center"><span className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700"><ShieldAlert className="size-8" /></span><div><h1 className="text-3xl font-extrabold">Account access unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Your account is currently restricted. Contact support if you believe this is a mistake.</p></div><Button render={<Link href="/support" />} className="bg-[#064E3B]">Contact support</Button></div>; }
