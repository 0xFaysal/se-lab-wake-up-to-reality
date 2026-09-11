import { AppError } from "../../../common/errors/app-error.js";

export const adminPropertyErrors = {
  alreadyVerified: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_ALREADY_VERIFIED",
      message: "Property is already verified",
    }),
  conflict: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_VERIFICATION_CONFLICT",
      message: "Property verification state has already changed",
    }),
  requirementsNotMet: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_VERIFICATION_REQUIREMENTS_NOT_MET",
      message: "Property does not meet approval requirements",
    }),
  mergeConflict: (reason: string) =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_MERGE_CONFLICT",
      message: reason,
    }),
};
