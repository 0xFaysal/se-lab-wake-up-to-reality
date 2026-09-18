import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your ParkEase BD account password securely with OTP verification.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
