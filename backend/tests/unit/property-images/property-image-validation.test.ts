import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../../src/common/errors/app-error.js";
import {
  propertyImageIdSchema,
  reorderPropertyImagesSchema,
} from "../../../src/modules/property-images/property-image.schema.js";
import { validatePropertyImageFile } from "../../../src/modules/property-images/property-image.validation.js";

const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("Property image validation", () => {
  it("accepts a valid PNG whose declared MIME matches its signature", async () => {
    const result = await validatePropertyImageFile({
      buffer: pngBuffer,
      mimetype: "image/png",
    });
    assert.equal(result.mimeType, "image/png");
  });

  it("rejects spoofed and unsupported file content", async () => {
    for (const input of [
      { buffer: pngBuffer, mimetype: "image/jpeg" },
      { buffer: Buffer.from("not-an-image"), mimetype: "image/png" },
    ]) {
      await assert.rejects(
        validatePropertyImageFile(input),
        (error: unknown) =>
          error instanceof AppError &&
          error.code === "PROPERTY_IMAGE_INVALID_TYPE",
      );
    }
  });

  it("rejects duplicate image IDs and a cover outside the order", () => {
    const first = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";
    const second = "1ab8bbeb-9668-4d1d-a798-7bc07162c720";
    assert.equal(
      reorderPropertyImagesSchema.safeParse({
        params: { propertyId: first },
        body: { imageIds: [second, second] },
      }).success,
      false,
    );
    assert.equal(
      reorderPropertyImagesSchema.safeParse({
        params: { propertyId: first },
        body: { imageIds: [first], coverImageId: second },
      }).success,
      false,
    );
  });

  it("requires valid Property and image UUID parameters", () => {
    assert.equal(
      propertyImageIdSchema.safeParse({
        params: { propertyId: "invalid", imageId: "invalid" },
      }).success,
      false,
    );
  });
});
