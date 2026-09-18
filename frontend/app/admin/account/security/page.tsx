import { AccountSecurityContent } from "@/features/profile/components/account-security-content";

export default function AdminAccountSecurityPage() {
  return <AccountSecurityContent sessionsHref="/admin/account/sessions" />;
}
