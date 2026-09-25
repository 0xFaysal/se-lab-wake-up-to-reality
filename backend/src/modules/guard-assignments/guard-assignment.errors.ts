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
  forbidden: () =>
    new AppError({
      statusCode: 403,
      code: "GUARD_MANAGEMENT_FORBIDDEN",
      message: "You are not allowed to manage Guards for this Property",
    }),
  membershipNotFound: () =>
    new AppError({
      statusCode: 404,
      code: "PROPERTY_GUARD_MEMBERSHIP_NOT_FOUND",
      message: "Property Guard membership was not found",
    }),
  membershipAlreadyExists: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_GUARD_MEMBERSHIP_ALREADY_EXISTS",
      message: "This Guard already has a current membership at the Property",
    }),
  membershipNotActive: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_GUARD_MEMBERSHIP_NOT_ACTIVE",
      message:
        "Guard must accept the Property membership before provider assignment",
    }),
  membershipRemovalBlocked: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_GUARD_REMOVAL_BLOCKED",
      message:
        "End every active Provider Guard assignment before removing this Guard",
    }),
  providerScopeRequired: () =>
    new AppError({
      statusCode: 400,
      code: "PROVIDER_SCOPE_REQUIRED",
      message:
        "providerMembershipId is required when a Manager can act for multiple Providers",
    }),
};
