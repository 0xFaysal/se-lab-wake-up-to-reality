export function serverInitializationFailure(requestId: string) {
  return {
    success: false,
    error: {
      code: "SERVICE_UNAVAILABLE",
      message: "Server is temporarily unavailable. Please try again.",
    },
    meta: { requestId, timestamp: new Date().toISOString() },
  };
}

export function initializationErrorMetadata(error: unknown) {
  const name = error instanceof Error ? error.name : "UnknownError";
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  return {
    name: /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) ? name : "Error",
    ...(typeof code === "string" && /^[A-Z0-9_]{1,64}$/.test(code)
      ? { code }
      : {}),
  };
}
