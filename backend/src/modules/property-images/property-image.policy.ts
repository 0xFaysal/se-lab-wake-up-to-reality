import { propertyImageMaxCount } from "../../common/uploads/image-upload.constants.js";

export function hasPropertyImageCapacity(
  existingCount: number,
  incomingCount: number,
): boolean {
  return (
    incomingCount > 0 &&
    existingCount >= 0 &&
    existingCount + incomingCount <= propertyImageMaxCount
  );
}

export function isCompletePropertyImageOrder(
  currentImageIds: readonly string[],
  requestedImageIds: readonly string[],
): boolean {
  if (
    currentImageIds.length === 0 ||
    currentImageIds.length !== requestedImageIds.length ||
    new Set(requestedImageIds).size !== requestedImageIds.length
  ) {
    return false;
  }

  const current = new Set(currentImageIds);
  return requestedImageIds.every((imageId) => current.has(imageId));
}

export function resolveCoverImageId(
  orderedImageIds: readonly string[],
  requestedCoverImageId: string | undefined,
  currentCoverImageId: string | undefined,
): string | undefined {
  if (orderedImageIds.length === 0) return undefined;
  if (
    requestedCoverImageId &&
    orderedImageIds.includes(requestedCoverImageId)
  ) {
    return requestedCoverImageId;
  }
  if (currentCoverImageId && orderedImageIds.includes(currentCoverImageId)) {
    return currentCoverImageId;
  }
  return orderedImageIds[0];
}
