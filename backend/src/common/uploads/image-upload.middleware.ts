import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/app-error.js";
import { propertyImageErrors } from "../../modules/property-images/property-image.errors.js";
import {
  propertyImageMaxBytes,
  propertyImageMaxCount,
} from "./image-upload.constants.js";

const declaredImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: propertyImageMaxBytes,
    files: propertyImageMaxCount,
    fields: 0,
    parts: propertyImageMaxCount,
  },
  fileFilter: (_req, file, callback) => {
    if (!declaredImageTypes.has(file.mimetype)) {
      callback(propertyImageErrors.invalidType());
      return;
    }
    callback(null, true);
  },
}).array("images", propertyImageMaxCount);

export const propertyImageUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(propertyImageErrors.tooLarge());
        return;
      }
      if (
        error.code === "LIMIT_FILE_COUNT" ||
        error.code === "LIMIT_PART_COUNT" ||
        (error.code === "LIMIT_UNEXPECTED_FILE" && error.field === "images")
      ) {
        next(propertyImageErrors.limitExceeded());
        return;
      }
    }

    next(
      new AppError({
        statusCode: 400,
        code: "PROPERTY_IMAGE_MULTIPART_INVALID",
        message: "Property image upload request is invalid",
      }),
    );
  });
};
