import {
  PropertyStatus,
  VerificationStatus,
  type PropertyImage,
} from "../../../generated/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";
import {
  getPropertyImageStorage,
  type PropertyImageStorage,
  type StoredPropertyImage,
} from "../../common/uploads/property-image-storage.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { propertyErrors } from "../properties/property.errors.js";
import * as propertyRepository from "../properties/property.repository.js";
import { propertyImageErrors } from "./property-image.errors.js";
import { toPropertyImageDto } from "./property-image.mapper.js";
import {
  hasPropertyImageCapacity,
  isCompletePropertyImageOrder,
  resolveCoverImageId,
} from "./property-image.policy.js";
import * as propertyImageRepository from "./property-image.repository.js";
import type { ReorderPropertyImagesInput } from "./property-image.types.js";
import { validatePropertyImageFile } from "./property-image.validation.js";

async function requireOwnedProperty(ownerUserId: string, propertyId: string) {
  const property = await propertyRepository.findPropertyByIdForOwner(
    propertyId,
    ownerUserId,
  );
  if (!property) throw propertyErrors.notFound();
  return property;
}

async function cleanupStoredImages(
  storage: PropertyImageStorage,
  images: readonly StoredPropertyImage[],
): Promise<void> {
  const cleanupResults = await Promise.allSettled(
    images.map((image) => storage.delete(image.storageKey)),
  );
  const failedCount = cleanupResults.filter(
    (result) => result.status === "rejected",
  ).length;
  if (failedCount > 0) {
    logger.error(
      { failedCount, errorType: "PropertyImageCleanupError" },
      "Uploaded Property image cleanup was incomplete",
    );
  }
}

export async function uploadPropertyImages(
  ownerUserId: string,
  propertyId: string,
  files: Express.Multer.File[],
) {
  if (files.length === 0) throw propertyImageErrors.required();
  await requireOwnedProperty(ownerUserId, propertyId);

  const validatedFiles = await Promise.all(
    files.map(validatePropertyImageFile),
  );
  const existingCount =
    await propertyImageRepository.countPropertyImages(propertyId);
  if (!hasPropertyImageCapacity(existingCount, validatedFiles.length)) {
    throw propertyImageErrors.limitExceeded();
  }

  const storage = getPropertyImageStorage();
  const uploaded: StoredPropertyImage[] = [];
  try {
    for (const file of validatedFiles) {
      uploaded.push(await storage.upload(file.buffer, propertyId));
    }
  } catch {
    await cleanupStoredImages(storage, uploaded);
    throw propertyImageErrors.uploadFailed();
  }

  try {
    const saved = await prisma.$transaction(async (tx) => {
      await propertyRepository.lockPropertyForMutation(propertyId, tx);
      const property = await propertyRepository.findPropertyByIdForOwner(
        propertyId,
        ownerUserId,
        tx,
      );
      if (!property) throw propertyErrors.notFound();

      const currentCount = await propertyImageRepository.countPropertyImages(
        propertyId,
        tx,
      );
      if (!hasPropertyImageCapacity(currentCount, uploaded.length)) {
        throw propertyImageErrors.limitExceeded();
      }

      const firstSortOrder =
        await propertyImageRepository.getNextPropertyImageSortOrder(
          propertyId,
          tx,
        );
      const images: PropertyImage[] = [];
      for (const [index, stored] of uploaded.entries()) {
        images.push(
          await propertyImageRepository.createPropertyImage(
            {
              propertyId,
              storageKey: stored.storageKey,
              url: stored.url,
              provider: "CLOUDINARY",
              imageType: validatedFiles[index]!.mimeType,
              sortOrder: firstSortOrder + index,
              isCover: currentCount === 0 && index === 0,
            },
            tx,
          ),
        );
      }
      return images;
    });

    return saved.map(toPropertyImageDto);
  } catch (error) {
    await cleanupStoredImages(storage, uploaded);
    if (error instanceof AppError) throw error;
    logger.error(
      { error, propertyId },
      "Failed to persist uploaded Property images",
    );
    throw propertyImageErrors.persistenceFailed();
  }
}

export async function listPropertyImages(
  ownerUserId: string,
  propertyId: string,
) {
  await requireOwnedProperty(ownerUserId, propertyId);
  const images = await propertyImageRepository.findPropertyImages(propertyId);
  return images.map(toPropertyImageDto);
}

export async function reorderPropertyImages(
  ownerUserId: string,
  propertyId: string,
  input: ReorderPropertyImagesInput,
) {
  const images = await prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const property = await propertyRepository.findPropertyByIdForOwner(
      propertyId,
      ownerUserId,
      tx,
    );
    if (!property) throw propertyErrors.notFound();

    const currentImages = await propertyImageRepository.findPropertyImages(
      propertyId,
      tx,
    );
    if (
      !isCompletePropertyImageOrder(
        currentImages.map((image) => image.id),
        input.imageIds,
      )
    ) {
      throw propertyImageErrors.invalidOrder();
    }

    const coverImageId = resolveCoverImageId(
      input.imageIds,
      input.coverImageId,
      currentImages.find((image) => image.isCover)?.id,
    );
    await propertyImageRepository.clearPropertyImageCovers(propertyId, tx);
    for (const [sortOrder, imageId] of input.imageIds.entries()) {
      const updated = await propertyImageRepository.updatePropertyImage(
        propertyId,
        imageId,
        { sortOrder, isCover: imageId === coverImageId },
        tx,
      );
      if (updated.count !== 1) throw propertyImageErrors.invalidOrder();
    }
    return propertyImageRepository.findPropertyImages(propertyId, tx);
  });

  return images.map(toPropertyImageDto);
}

export async function deletePropertyImage(
  ownerUserId: string,
  propertyId: string,
  imageId: string,
): Promise<void> {
  const image = await prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const property = await propertyRepository.findPropertyByIdForOwner(
      propertyId,
      ownerUserId,
      tx,
    );
    if (!property) throw propertyErrors.notFound();

    const existingImage = await propertyImageRepository.findPropertyImage(
      propertyId,
      imageId,
      tx,
    );
    if (!existingImage) throw propertyImageErrors.notFound();
    return existingImage;
  });

  try {
    await getPropertyImageStorage().delete(image.storageKey);
  } catch {
    throw propertyImageErrors.deleteFailed();
  }

  await prisma.$transaction(async (tx) => {
    await propertyRepository.lockPropertyForMutation(propertyId, tx);
    const property = await propertyRepository.findPropertyByIdForOwner(
      propertyId,
      ownerUserId,
      tx,
    );
    if (!property) throw propertyErrors.notFound();
    const currentImage = await propertyImageRepository.findPropertyImage(
      propertyId,
      imageId,
      tx,
    );
    if (!currentImage) throw propertyImageErrors.notFound();

    const deleted = await propertyImageRepository.deletePropertyImage(
      propertyId,
      imageId,
      tx,
    );
    if (deleted.count !== 1) throw propertyImageErrors.notFound();

    const remaining = await propertyImageRepository.findPropertyImages(
      propertyId,
      tx,
    );
    if (remaining.length === 0) {
      if (property.verificationStatus === VerificationStatus.VERIFIED) {
        await propertyRepository.updatePropertyByIdForOwner(
          propertyId,
          ownerUserId,
          {
            verificationStatus: VerificationStatus.PENDING,
            status: PropertyStatus.INACTIVE,
            verifiedByAdminId: null,
            verifiedAt: null,
            rejectionReason: null,
          },
          tx,
        );
      }
      return;
    }

    const coverImageId = resolveCoverImageId(
      remaining.map((item) => item.id),
      undefined,
      currentImage.isCover
        ? undefined
        : remaining.find((item) => item.isCover)?.id,
    );
    await propertyImageRepository.clearPropertyImageCovers(propertyId, tx);
    for (const [sortOrder, item] of remaining.entries()) {
      await propertyImageRepository.updatePropertyImage(
        propertyId,
        item.id,
        { sortOrder, isCover: item.id === coverImageId },
        tx,
      );
    }
  });
}
