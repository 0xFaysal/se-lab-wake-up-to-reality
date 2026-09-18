import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/app-error.js";

export const rightDocumentMaxCount = 5;
export const rightDocumentMaxBytes = 10 * 1024 * 1024;
const declaredTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: rightDocumentMaxBytes, files: rightDocumentMaxCount, fields: 1, parts: rightDocumentMaxCount + 1 },
  fileFilter: (_req, file, callback) => {
    if (declaredTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError({
        statusCode: 400,
        code: "RIGHT_DOCUMENT_TYPE_INVALID",
        message: "Only PDF, JPEG, PNG, and WebP evidence files are accepted",
      }),
    );
  },
}).array("documents", rightDocumentMaxCount);

export const rightDocumentUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) return next();
    if (error instanceof AppError) return next(error);
    if (error instanceof multer.MulterError) {
      const limit = error.code === "LIMIT_FILE_SIZE" ? "Each evidence file must be 10 MB or smaller" : "No more than 5 evidence files may be uploaded";
      return next(new AppError({ statusCode: 400, code: "RIGHT_DOCUMENT_LIMIT_EXCEEDED", message: limit }));
    }
    return next(new AppError({ statusCode: 400, code: "RIGHT_DOCUMENT_MULTIPART_INVALID", message: "Parking Right evidence upload is invalid" }));
  });
};
