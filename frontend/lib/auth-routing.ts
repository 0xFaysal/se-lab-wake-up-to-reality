import { portalHome } from "@/config/app-config";
import type { AuthUser, UserRole } from "@/lib/api/api-types";

export type RequiredAccountAction =
  | { kind: "SIGN_IN" }
  | { kind: "BLOCKED"; reason: "SUSPENDED" | "BLOCKED" }
  | { kind: "CHANGE_INITIAL_PASSWORD" }
  | { kind: "VERIFY_EMAIL" }
  | { kind: "READY"; destination: string };

export function getPrimaryRole(user: AuthUser): UserRole | null {
  return user.roles.find((role) => role in portalHome) ?? null;
}

export function getRequiredAccountAction(user: AuthUser | null | undefined): RequiredAccountAction {
  if (!user) return { kind: "SIGN_IN" };
  if (user.status === "SUSPENDED" || user.status === "BLOCKED") return { kind: "BLOCKED", reason: user.status };
  if (user.mustChangePassword) return { kind: "CHANGE_INITIAL_PASSWORD" };
  if (!user.emailVerified) return { kind: "VERIFY_EMAIL" };
  const role = getPrimaryRole(user);
  return { kind: "READY", destination: role ? portalHome[role] : "/" };
}

export function destinationForUser(user: AuthUser): string {
  const action = getRequiredAccountAction(user);
  if (action.kind === "CHANGE_INITIAL_PASSWORD") return "/change-initial-password";
  if (action.kind === "VERIFY_EMAIL") return "/verify-otp?type=email";
  if (action.kind === "BLOCKED") return `/account-unavailable?reason=${action.reason.toLowerCase()}`;
  if (action.kind === "READY") return action.destination;
  return "/login";
}
