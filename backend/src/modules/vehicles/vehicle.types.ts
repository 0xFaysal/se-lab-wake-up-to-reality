import type { z } from "zod";
import type {
  createVehicleSchema,
  updateVehicleSchema,
} from "./vehicle.schema.js";

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>["body"];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>["body"];
