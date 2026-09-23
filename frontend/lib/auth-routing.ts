import { portalHome, routeRoles } from "@/config/app-config";
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

export function isRouteAllowedForRoles(pathname: string, roles: UserRole[]): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const matchingRule = routeRoles.find(
    (rule) => cleanPath === rule.prefix || cleanPath.startsWith(rule.prefix + "/")
  );
  if (!matchingRule) return true;
  return matchingRule.roles.some((role) => roles.includes(role));
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

export function resolvePostLoginRedirect(user: AuthUser, redirectParam?: string | null): string {
  const action = getRequiredAccountAction(user);
  if (action.kind !== "READY") {
    return destinationForUser(user);
  }

  if (
    redirectParam &&
    /^\/[a-zA-Z0-9_\-]/.test(redirectParam) &&
    !redirectParam.startsWith("//") &&
    !redirectParam.includes("\\") &&
    !/\s/.test(redirectParam)
  ) {
    const cleanPath = redirectParam.split("?")[0].split("#")[0];
    const isAuthRoute =
      cleanPath === "/login" ||
      cleanPath.startsWith("/login/") ||
      cleanPath === "/register" ||
      cleanPath.startsWith("/register/") ||
      cleanPath === "/verify-otp" ||
      cleanPath.startsWith("/verify-otp/") ||
      cleanPath === "/change-initial-password" ||
      cleanPath.startsWith("/change-initial-password/") ||
      cleanPath === "/forgot-password" ||
      cleanPath.startsWith("/forgot-password/") ||
      cleanPath === "/reset-password" ||
      cleanPath.startsWith("/reset-password/");

    if (!isAuthRoute && isRouteAllowedForRoles(cleanPath, user.roles)) {
      return redirectParam;
    }
  }

  return action.destination;
}

