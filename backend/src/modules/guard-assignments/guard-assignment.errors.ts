import { AppError } from "../../common/errors/app-error.js";

export const guardAssignmentErrors = {
  guardNotFound: () =>
    new AppError({
      statusCode: 404,
      code: "GUARD_NOT_FOUND",
      message: "An eligible Guard account was not found",
    }),
  guardNotEligible: () =>
    new AppError({
      statusCode: 403,
      code: "GUARD_NOT_ELIGIBLE",
      message:
        "Guard onboarding and mandatory email verification must be complete",
    }),
  propertyNotEligible: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_NOT_ELIGIBLE_FOR_GUARD_ASSIGNMENT",
      message: "Property must be verified and active before inviting a Guard",
    }),
  notFound: () =>
    new AppError({
      statusCode: 404,
      code: "GUARD_ASSIGNMENT_NOT_FOUND",
      message: "Guard assignment was not found",
    }),
  alreadyExists: () =>
    new AppError({
      statusCode: 409,
      code: "GUARD_ASSIGNMENT_ALREADY_EXISTS",
      message:
        "A non-terminal assignment already exists for this Guard and Property",
    }),
  stateConflict: () =>
    new AppError({
      statusCode: 409,
      code: "GUARD_ASSIGNMENT_STATE_CONFLICT",
      message: "Guard assignment state changed while processing the request",
    }),
  invalidTransition: () =>
    new AppError({
      statusCode: 409,
      code: "GUARD_ASSIGNMENT_INVALID_TRANSITION",
      message: "Requested Guard assignment transition is not allowed",
    }),
};
