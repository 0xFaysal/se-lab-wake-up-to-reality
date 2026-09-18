import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Join ParkEase BD as a Driver or Parking Owner in Dhaka. Fast, secure parking management.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <RegisterForm />
    </Suspense>
  );
}
