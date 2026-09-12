export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "UNKNOWN_ERROR",
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "Please sign in to continue.",
  AUTH_UNAUTHORIZED: "Your session has expired. Please sign in again.",
  AUTH_FORBIDDEN: "You do not have permission to perform this action.",
  AUTH_INVALID_CREDENTIALS: "The current password or sign-in details are incorrect.",
  AUTH_PASSWORD_RESET_TOKEN_INVALID: "This reset link is invalid, expired, or has already been used.",
  AUTH_NEW_PASSWORD_MUST_DIFFER: "Choose a password different from your current password.",
  AUTH_SESSION_NOT_FOUND: "That session is no longer active.",
  VEHICLE_NOT_FOUND: "That vehicle could not be found.",
  VEHICLE_REGISTRATION_CONFLICT: "A vehicle with this registration is already registered.",
  VEHICLE_DELETE_BLOCKED: "This vehicle cannot be deleted in its current state.",
  PROPERTY_NOT_FOUND: "That property could not be found.",
  PROPERTY_INVALID_STATE: "This property cannot be changed in its current state.",
  PROPERTY_DELETE_BLOCKED: "Remove property images and finish active Guard dependencies before deleting this property.",
  PROPERTY_VERSION_CONFLICT: "This property changed since you opened it. Reload and try again.",
  PROPERTY_IMAGE_LIMIT_EXCEEDED: "A property can have at most 10 images.",
  PROPERTY_IMAGE_REQUIRED: "Choose at least one property image.",
  PROPERTY_IMAGE_INVALID_TYPE: "Only JPEG, PNG, and WebP images are supported.",
  PROPERTY_IMAGE_TOO_LARGE: "Each property image must be 5 MB or smaller.",
  PROPERTY_IMAGE_NOT_FOUND: "That property image no longer exists.",
  PROPERTY_IMAGE_UPLOAD_FAILED: "Image storage is temporarily unavailable. Please retry.",
  PROPERTY_IMAGE_DELETE_FAILED: "The image could not be removed from storage.",
  PROPERTY_VERIFICATION_CONFLICT: "This property was reviewed by someone else. Refresh and try again.",
  PROPERTY_VERIFICATION_REQUIREMENTS_NOT_MET: "Approval requires valid property details and at least one image.",
  GUARD_ASSIGNMENT_ALREADY_EXISTS: "This guard already has an active assignment.",
  GUARD_ASSIGNMENT_STATE_CONFLICT: "The assignment state changed. Refresh and try again.",
  GUARD_ASSIGNMENT_NOT_FOUND: "That Guard assignment could not be found.",
  GUARD_ASSIGNMENT_INVALID_TRANSITION: "That Guard assignment action is not allowed in its current state.",
  PROPERTY_GUARD_MEMBERSHIP_ALREADY_EXISTS: "This Guard already belongs to the property Guard pool.",
  PROPERTY_GUARD_MEMBERSHIP_NOT_ACTIVE: "The Guard must accept the property invitation before a shift can be assigned.",
};

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return FRIENDLY_MESSAGES[error.code] ?? error.message;
  return "Something went wrong. Please try again.";
}
