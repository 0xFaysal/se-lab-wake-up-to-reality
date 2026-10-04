export function propertyJourneyProgress(input: {
  verified: boolean;
  rejected: boolean;
  resourceCount: number | null;
  activeListingCount: number | null;
  failed: boolean;
}) {
  const { verified, rejected, resourceCount, activeListingCount, failed } = input;
  const loading = resourceCount === null || activeListingCount === null;
  const parkingAdded = verified && (resourceCount ?? 0) > 0;
  const published = parkingAdded && (activeListingCount ?? 0) > 0;
  const status = !verified
    ? rejected ? "Action required" : "Verification in progress"
    : failed ? "Parking status unavailable"
    : loading ? "Checking parking setup"
    : published ? "Listing is live"
    : parkingAdded ? "Next: publish parking" : "Next: add parking";
  return {
    status,
    steps: [
      { label: "Details submitted", detail: "Property and location saved", complete: true, current: false },
      { label: "Admin verification", detail: verified ? "Property approved" : rejected ? "Changes requested" : "Security review in progress", complete: verified, current: !verified },
      { label: "Parking setup", detail: parkingAdded ? `${resourceCount} parking resource(s) added` : verified ? "Add spaces and confirm authority" : "Available after approval", complete: parkingAdded, current: verified && !loading && !failed && !parkingAdded },
      { label: "Publish", detail: published ? "Parking offer is live" : "Set availability and pricing", complete: published, current: parkingAdded && !loading && !failed && !published },
    ],
  };
}
