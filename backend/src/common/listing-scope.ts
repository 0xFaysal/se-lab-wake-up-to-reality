// Offers may price different vehicle types without creating extra physical capacity.
export function listingScopesOverlap(
  a: {
    parkingResourceUnitId: string | null;
    allowedVehicleTypes: readonly string[];
  },
  b: {
    parkingResourceUnitId: string | null;
    allowedVehicleTypes: readonly string[];
  },
) {
  const unitsOverlap =
    !a.parkingResourceUnitId ||
    !b.parkingResourceUnitId ||
    a.parkingResourceUnitId === b.parkingResourceUnitId;
  return (
    unitsOverlap &&
    a.allowedVehicleTypes.some((type) => b.allowedVehicleTypes.includes(type))
  );
}
