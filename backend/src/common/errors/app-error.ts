export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational: boolean;
  constructor(o: {
    message: string;
    statusCode: number;
    code: string;
    details?: unknown;
    isOperational?: boolean;
  }) {
    super(o.message);
    this.name = "AppError";
    this.statusCode = o.statusCode;
    this.code = o.code;
    this.details = o.details;
    this.isOperational = o.isOperational ?? true;
  }
}
