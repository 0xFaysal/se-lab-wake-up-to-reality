import { getCloudinary } from "../../config/cloudinary.js";

export type StoredRightDocument = { storageKey: string; secureUrl: string };

export type RightDocumentStorage = {
  upload(buffer: Buffer, parentId: string, mimeType: string): Promise<StoredRightDocument>;
  delete(storageKey: string, mimeType: string): Promise<void>;
  signedUrl(storageKey: string, mimeType: string, expiresAt: number): string;
};

function resourceType(mimeType: string) { return mimeType === "application/pdf" ? "raw" as const : "image" as const; }

const cloudinaryStorage: RightDocumentStorage = {
  upload(buffer, parentId, mimeType) {
    return new Promise((resolve, reject) => {
      const client = getCloudinary();
      const stream = client.uploader.upload_stream({ folder: `parkease/parking-right-evidence/${parentId}`, resource_type: resourceType(mimeType), type: "authenticated", overwrite: false, unique_filename: true, use_filename: false }, (error, result) => {
        if (error || !result?.public_id || !result.secure_url?.startsWith("https://")) return reject(error ?? new Error("RIGHT_DOCUMENT_STORAGE_INVALID_RESPONSE"));
        resolve({ storageKey: result.public_id, secureUrl: result.secure_url });
      });
      stream.end(buffer);
    });
  },
  async delete(storageKey, mimeType) {
    const result = await getCloudinary().uploader.destroy(storageKey, { resource_type: resourceType(mimeType), type: "authenticated", invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") throw new Error("RIGHT_DOCUMENT_STORAGE_DELETE_FAILED");
  },
  signedUrl(storageKey, mimeType, expiresAt) {
    return getCloudinary().url(storageKey, { resource_type: resourceType(mimeType), type: "authenticated", sign_url: true, secure: true, expires_at: expiresAt });
  },
};

let activeStorage = cloudinaryStorage;
export function getRightDocumentStorage() { return activeStorage; }
export function setRightDocumentStorageForTests(storage: RightDocumentStorage) { activeStorage = storage; }
export function resetRightDocumentStorageForTests() { activeStorage = cloudinaryStorage; }
