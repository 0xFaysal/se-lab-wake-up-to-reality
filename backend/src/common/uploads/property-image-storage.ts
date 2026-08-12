import { getCloudinary } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";

export type StoredPropertyImage = {
  storageKey: string;
  url: string;
};

export type PropertyImageStorage = {
  upload(buffer: Buffer, propertyId: string): Promise<StoredPropertyImage>;
  delete(storageKey: string): Promise<void>;
};

const cloudinaryPropertyImageStorage: PropertyImageStorage = {
  upload(buffer, propertyId) {
    return new Promise((resolve, reject) => {
      let client: ReturnType<typeof getCloudinary>;
      try {
        client = getCloudinary();
      } catch (error) {
        reject(error);
        return;
      }

      const stream = client.uploader.upload_stream(
        {
          folder: `parkease/properties/${propertyId}`,
          resource_type: "image",
          type: "upload",
          overwrite: false,
          unique_filename: true,
          use_filename: false,
          transformation: [{ flags: "strip_profile", quality: "auto:good" }],
        },
        (error, result) => {
          if (
            error ||
            !result?.public_id ||
            !result.secure_url?.startsWith("https://")
          ) {
            reject(error ?? new Error("IMAGE_STORAGE_INVALID_RESPONSE"));
            return;
          }
          resolve({
            storageKey: result.public_id,
            url: result.secure_url,
          });
        },
      );

      stream.end(buffer);
    });
  },

  async delete(storageKey) {
    const result = await getCloudinary().uploader.destroy(storageKey, {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error("IMAGE_STORAGE_DELETE_FAILED");
    }
  },
};

let activePropertyImageStorage = cloudinaryPropertyImageStorage;

export function getPropertyImageStorage(): PropertyImageStorage {
  return activePropertyImageStorage;
}

export function setPropertyImageStorageForTests(
  storage: PropertyImageStorage,
): void {
  if (env.NODE_ENV !== "test") {
    throw new Error("Property image storage can be replaced only in tests");
  }
  activePropertyImageStorage = storage;
}

export function resetPropertyImageStorageForTests(): void {
  if (env.NODE_ENV === "test") {
    activePropertyImageStorage = cloudinaryPropertyImageStorage;
  }
}
