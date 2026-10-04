export const PROPERTY_MATCH_RADIUS_METERS = 75;
const EARTH_RADIUS = 6_371_000;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function propertyDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const value =
    Math.sin(radians(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
  return (
    EARTH_RADIUS * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, value))))
  );
}

export function propertySearchBounds(latitude: number) {
  const latitudeDelta =
    ((PROPERTY_MATCH_RADIUS_METERS / EARTH_RADIUS) * 180) / Math.PI;
  const extremeLatitude = Math.min(90, Math.abs(latitude) + latitudeDelta);
  return {
    latitudeDelta,
    longitudeDelta: Math.min(
      180,
      latitudeDelta / Math.max(1e-10, Math.cos(radians(extremeLatitude))),
    ),
  };
}
