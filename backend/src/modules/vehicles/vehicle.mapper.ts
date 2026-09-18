import type { Vehicle } from "../../../generated/prisma/client.js";

export function toVehicleResponse(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    vehicleType: vehicle.vehicleType,
    registrationNumber: vehicle.registrationNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    heightCm: vehicle.heightCm,
    widthCm: vehicle.widthCm,
    lengthCm: vehicle.lengthCm,
    verificationStatus: vehicle.verificationStatus,
    isDefault: vehicle.isDefault,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}
