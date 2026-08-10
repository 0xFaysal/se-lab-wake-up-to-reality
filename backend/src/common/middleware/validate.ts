import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";

type RequestParts = {
  body?: unknown;
  params?: unknown;
  query?: unknown;
};

export function validate(schema: z.ZodType<RequestParts>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      next(
        new AppError({
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: z.flattenError(result.error).fieldErrors,
        }),
      );
      return;
    }

    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) {
      req.params = result.data.params as typeof req.params;
    }
    next();
  };
}
