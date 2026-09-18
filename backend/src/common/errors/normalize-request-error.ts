import { AppError } from "./app-error.js";

type BodyParserError = SyntaxError & {
  body?: unknown;
  status?: number;
  statusCode?: number;
  type?: string;
};

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

export const isMalformedJsonError = (
  error: unknown,
): error is BodyParserError => {
  if (!(error instanceof SyntaxError)) return false;

  const candidate = error as BodyParserError;
  return (
    candidate.type === "entity.parse.failed" ||
    ((candidate.status === 400 || candidate.statusCode === 400) &&
      hasOwn(candidate, "body"))
  );
};

export const normalizeRequestError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  if (isMalformedJsonError(error)) {
    return new AppError({
      statusCode: 400,
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON",
    });
  }

  return new AppError({
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
    isOperational: false,
  });
};
