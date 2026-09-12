import type { Metadata } from "next";
import { ChangeInitialPasswordForm } from "@/components/auth/change-initial-password-form";
export const metadata: Metadata = { title: "Change Initial Password" };
export default function ChangeInitialPasswordPage() { return <ChangeInitialPasswordForm />; }
