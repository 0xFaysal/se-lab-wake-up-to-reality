export function selectWorkingProperty<
  T extends {
    id: string;
    name: string;
    status: string;
    verificationStatus: string;
  },
>(properties: T[] | undefined, requestedId: string | null) {
  return (
    properties?.find((property) => property.id === requestedId) ??
    properties?.find(
      (property) =>
        property.status === "ACTIVE" &&
        property.verificationStatus === "VERIFIED",
    ) ??
    properties?.[0]
  );
}
