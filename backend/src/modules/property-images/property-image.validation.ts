import { fileTypeFromBuffer } from "file-type";
import { propertyImageErrors } from "./property-image.errors.js";

const allowedDetectedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type PropertyImageFileInput = {
  buffer: Buffer;
  mimetype: string;
};

export type ValidatedImageFile = {
  buffer: Buffer;
  mimeType: string;
};

export async function validatePropertyImageFile(
  file: PropertyImageFileInput,
): Promise<ValidatedImageFile> {
  const detected = await fileTypeFromBuffer(file.buffer);
  if (
    !detected ||
    !allowedDetectedImageTypes.has(detected.mime) ||
    detected.mime !== file.mimetype
  ) {
    throw propertyImageErrors.invalidType();
  }
  return { buffer: file.buffer, mimeType: detected.mime };
}
