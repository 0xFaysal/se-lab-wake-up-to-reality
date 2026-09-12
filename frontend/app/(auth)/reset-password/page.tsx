import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose New Password", description: "Complete a secure ParkEase BD password reset." };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const value = (await searchParams).token;
  return <ResetPasswordForm token={Array.isArray(value) ? value[0] ?? "" : value ?? ""} />;
}
