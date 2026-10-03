export function approximateCoordinates(
  _propertyId: string,
  latitude: number,
  longitude: number,
) {
  // Publish a neighbourhood grid, not a reversible offset from the entrance.
  return {
    latitude: Math.round(latitude * 100) / 100,
    longitude: Math.round(longitude * 100) / 100,
  };
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
