import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your ParkEase BD account to manage or book parking.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <LoginForm />
    </Suspense>
  );
}
