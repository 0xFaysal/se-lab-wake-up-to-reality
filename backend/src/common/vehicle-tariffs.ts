export function validateVehicleTariffs(
  vehicles: readonly string[],
  rates: readonly { vehicleType: string; pricePerHourPaisa: bigint }[],
) {
  return (
    vehicles.length > 0 &&
    new Set(vehicles).size === vehicles.length &&
    rates.length === vehicles.length &&
    new Set(rates.map((rate) => rate.vehicleType)).size === rates.length &&
    rates.every(
      (rate) =>
        vehicles.includes(rate.vehicleType) &&
        rate.pricePerHourPaisa > 0n &&
        rate.pricePerHourPaisa <= 9223372036854775807n,
    )
  );
}
