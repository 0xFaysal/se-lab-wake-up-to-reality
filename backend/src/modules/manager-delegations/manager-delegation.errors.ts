import { AppError } from "../../common/errors/app-error.js";

export const managerDelegationErrors = {
  notFound: () =>
    new AppError({
      statusCode: 404,
      code: "MANAGER_DELEGATION_NOT_FOUND",
      message: "Manager delegation was not found",
    }),
  managerNotEligible: () =>
    new AppError({
      statusCode: 404,
      code: "ELIGIBLE_MANAGER_NOT_FOUND",
      message: "An eligible Manager account was not found",
    }),
  conflict: () =>
    new AppError({
      statusCode: 409,
      code: "MANAGER_DELEGATION_CONFLICT",
      message: "A current delegation already exists or its state changed",
    }),
  permissionRequired: () =>
    new AppError({
      statusCode: 403,
      code: "MANAGER_DELEGATION_PERMISSION_REQUIRED",
      message: "The active delegation does not grant this permission",
    }),
  invalidResourceScope: () =>
    new AppError({
      statusCode: 400,
      code: "MANAGER_DELEGATION_RESOURCE_INVALID",
      message: "Every delegated resource must belong to the grantor at this Property",
    }),
  forbidden: () =>
    new AppError({
      statusCode: 403,
      code: "MANAGER_DELEGATION_FORBIDDEN",
      message: "You are not allowed to manage this delegation",
    }),
  invalidTransition: () =>
    new AppError({
      statusCode: 409,
      code: "MANAGER_DELEGATION_INVALID_TRANSITION",
      message: "Requested Manager delegation transition is not allowed",
    }),
};
