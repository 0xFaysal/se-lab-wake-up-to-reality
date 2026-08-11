import { AppError } from "../../common/errors/app-error.js";

export const vehicleErrors = {
  notFound: () =>
    new AppError({
      statusCode: 404,
      code: "VEHICLE_NOT_FOUND",
      message: "Vehicle was not found",
    }),

  registrationConflict: () =>
    new AppError({
      statusCode: 409,
      code: "VEHICLE_REGISTRATION_CONFLICT",
      message: "A vehicle with this registration number already exists",
    }),

  deleteBlocked: () =>
    new AppError({
      statusCode: 409,
      code: "VEHICLE_DELETE_BLOCKED",
      message: "Vehicle cannot be deleted in its current state",
    }),

  invalidState: () =>
    new AppError({
      statusCode: 409,
      code: "VEHICLE_INVALID_STATE",
      message: "Vehicle state changed while processing the request",
    }),
};
