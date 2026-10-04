import {
  PageEmptyState,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";

export default function ProviderSupportTicketPage() {
  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Support request"
        description="Contact and follow-up for your provider account."
        breadcrumbs={[
          { label: "Support", href: "/provider/support" },
          { label: "Request" },
        ]}
      />
      <PageEmptyState
        title="Ticket tracking is not available"
        description="This release uses email support. Check your email for replies to your request."
        action={{ label: "Contact support", href: "/provider/support" }}
      />
    </ProviderPage>
  );
}
