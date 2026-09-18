import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

/* This middleware generates a unique request ID for each incoming request.
It checks for the presence of an "x-request-id" header in the request.
If the header is present and its length is less than or equal to 100 characters,
it uses that value as the request ID. Otherwise, it generates a new UUID as the request ID.
The generated or provided request ID is then attached to the request object and also set in the response headers for tracking purposes.
This allows for better tracing and debugging of requests throughout the application. */

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header("x-request-id");

  const id = incoming && incoming.length <= 100 ? incoming : randomUUID();

  req.requestId = id;

  res.setHeader("x-request-id", id);

  next();
};
