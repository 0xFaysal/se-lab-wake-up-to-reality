import { AppError } from "../../common/errors/app-error.js";

export const governanceErrors = {
  notFound: () =>
    new AppError({
      statusCode: 404,
      code: "PROPERTY_GOVERNANCE_NOT_FOUND",
      message: "Property governance resource was not found",
    }),
  providerRequired: () =>
    new AppError({
      statusCode: 403,
      code: "ACTIVE_VERIFIED_PROVIDER_REQUIRED",
      message: "An active and verified Provider membership is required",
    }),
  commonAuthorityRequired: () =>
    new AppError({
      statusCode: 403,
      code: "PROPERTY_COMMON_AUTHORITY_REQUIRED",
      message: "Current Property governance does not permit this shared operation",
    }),
  managerRelationshipRequired: () =>
    new AppError({
      statusCode: 409,
      code: "BUILDING_MANAGER_RELATIONSHIP_REQUIRED",
      message: "The candidate must be a Property Provider or a related Manager",
    }),
  conflict: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_GOVERNANCE_CONFLICT",
      message: "Property governance state changed; reload and try again",
    }),
  rejectionReasonRequired: () =>
    new AppError({
      statusCode: 400,
      code: "GOVERNANCE_REJECTION_REASON_REQUIRED",
      message: "A rejection reason is required",
    }),
  membershipExitBlocked: () =>
    new AppError({
      statusCode: 409,
      code: "PROPERTY_PROVIDER_EXIT_BLOCKED",
      message: "Transfer or retire active parking resources before leaving this Property",
    }),
};
