import { AppError } from "../../common/errors/app-error.js";

export const propertyErrors = {
  notFound: () =>
    new AppError({
      statusCode: 404,
      code: "PROPERTY_NOT_FOUND",
      message: "Property was not found",
    }),

  invalidState: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_INVALID_STATE",
      message: "Property cannot be changed in its current state",
    }),

  deleteBlocked: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_DELETE_BLOCKED",
      message: "Property has dependent records and cannot be deleted",
    }),

  encryptionFailed: () =>
    new AppError({
      statusCode: 500,
      code: "PROPERTY_ENCRYPTION_FAILED",
      message: "Unable to process protected property information",
      isOperational: false,
    }),
};
