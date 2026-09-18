import type { PropertyImage } from "../../../generated/prisma/client.js";

export function toPropertyImageDto(
  image: Pick<
    PropertyImage,
    | "id"
    | "url"
    | "imageType"
    | "sortOrder"
    | "isCover"
    | "createdAt"
    | "updatedAt"
  >,
) {
  return {
    id: image.id,
    url: image.url,
    mimeType: image.imageType,
    sortOrder: image.sortOrder,
    isCover: image.isCover,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  };
}
