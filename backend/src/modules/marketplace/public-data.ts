export function approximateCoordinates(
  _propertyId: string,
  latitude: number,
  longitude: number,
) {
  // A 50 m grid keeps the entrance inside the public 40 m area without publishing it.
  const metresPerDegree = (Math.PI * 6_371_000) / 180;
  const latitudeStep = 50 / metresPerDegree;
  const approximateLatitude =
    Math.round(latitude / latitudeStep) * latitudeStep;
  const longitudeStep =
    50 /
    (metresPerDegree *
      Math.max(0.000001, Math.cos((approximateLatitude * Math.PI) / 180)));
  return {
    latitude: approximateLatitude,
    longitude: Math.round(longitude / longitudeStep) * longitudeStep,
  };
}

export function driverLocationDisclosure(
  consent: boolean,
  property: { id: string; name: string; latitude: unknown; longitude: unknown },
) {
  if (!consent)
    return {
      available: false as const,
      reason: "PROVIDER_CONSENT_REQUIRED" as const,
    };
  return {
    available: true as const,
    propertyId: property.id,
    name: property.name,
    latitude: Number(property.latitude),
    longitude: Number(property.longitude),
  };
}

export function confirmedBookingCoordinates(
  confirmed: boolean,
  property: { latitude: unknown; longitude: unknown } | null,
) {
  if (
    !confirmed ||
    !property ||
    property.latitude == null ||
    property.longitude == null
  )
    return null;
  const latitude = Number(property.latitude);
  const longitude = Number(property.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;
  return { latitude, longitude };
}

export function operationalBooking<T>(value: T): T {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(operationalBooking) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        ([key]) =>
          !/(paisa|bps)$/i.test(key) &&
          !/^(payment|payments|settlement|cancellation|wallet|ledger|quote)/i.test(
            key,
          ),
      )
      .map(([key, item]) => [key, operationalBooking(item)]),
  ) as T;
}
