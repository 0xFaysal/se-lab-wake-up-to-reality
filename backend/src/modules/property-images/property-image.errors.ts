import { AppError } from "../../common/errors/app-error.js";

export const propertyImageErrors = {
  required: () =>
    new AppError({
      statusCode: 400,
      code: "PROPERTY_IMAGE_REQUIRED",
      message: "At least one Property image is required",
    }),
  notFound: () =>
    new AppError({
      statusCode: 404,
      code: "PROPERTY_IMAGE_NOT_FOUND",
      message: "Property image was not found",
    }),
  limitExceeded: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_IMAGE_LIMIT_EXCEEDED",
      message: "A Property can have at most 10 images",
    }),
  invalidType: () =>
    new AppError({
      statusCode: 415,
      code: "PROPERTY_IMAGE_INVALID_TYPE",
      message: "Only valid JPEG, PNG, and WebP images are supported",
    }),
  tooLarge: () =>
    new AppError({
      statusCode: 413,
      code: "PROPERTY_IMAGE_TOO_LARGE",
      message: "Each Property image must be 5 MB or smaller",
    }),
  uploadFailed: () =>
    new AppError({
      statusCode: 502,
      code: "PROPERTY_IMAGE_UPLOAD_FAILED",
      message: "Property image storage is temporarily unavailable",
    }),
  persistenceFailed: () =>
    new AppError({
      statusCode: 500,
      code: "PROPERTY_IMAGE_PERSISTENCE_FAILED",
      message: "Property images could not be saved",
    }),
  deleteFailed: () =>
    new AppError({
      statusCode: 502,
      code: "PROPERTY_IMAGE_DELETE_FAILED",
      message: "Property image could not be deleted from storage",
    }),
  invalidOrder: () =>
    new AppError({
      statusCode: 400,
      code: "PROPERTY_IMAGE_ORDER_INVALID",
      message: "Image order must contain every Property image exactly once",
    }),
};
