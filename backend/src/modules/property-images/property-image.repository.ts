import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

type PropertyImageClient = Pick<Prisma.TransactionClient, "propertyImage">;

export const propertyImagePublicSelect = {
  id: true,
  url: true,
  imageType: true,
  sortOrder: true,
  isCover: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PropertyImageSelect;

export function countPropertyImages(
  propertyId: string,
  db: PropertyImageClient = prisma,
) {
  return db.propertyImage.count({ where: { propertyId } });
}

export function findPropertyImages(
  propertyId: string,
  db: PropertyImageClient = prisma,
) {
  return db.propertyImage.findMany({
    where: { propertyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
}

export function findPropertyImage(
  propertyId: string,
  imageId: string,
  db: PropertyImageClient = prisma,
) {
  return db.propertyImage.findFirst({
    where: { id: imageId, propertyId },
  });
}

export async function getNextPropertyImageSortOrder(
  propertyId: string,
  db: PropertyImageClient = prisma,
): Promise<number> {
  const result = await db.propertyImage.aggregate({
    where: { propertyId },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? -1) + 1;
}

export function createPropertyImage(
  data: Prisma.PropertyImageUncheckedCreateInput,
  db: PropertyImageClient = prisma,
) {
  return db.propertyImage.create({ data });
}

export function clearPropertyImageCovers(
  propertyId: string,
  db: PropertyImageClient = prisma,
) {
  return db.propertyImage.updateMany({
    where: { propertyId, isCover: true },
    data: { isCover: false },
  });
}

export function updatePropertyImage(
  propertyId: string,
  imageId: string,
  data: Prisma.PropertyImageUpdateManyMutationInput,
  db: PropertyImageClient = prisma,
) {
  return db.propertyImage.updateMany({
    where: { id: imageId, propertyId },
    data,
  });
}

export function deletePropertyImage(
  propertyId: string,
  imageId: string,
  db: PropertyImageClient = prisma,
) {
  return db.propertyImage.deleteMany({
    where: { id: imageId, propertyId },
  });
}
