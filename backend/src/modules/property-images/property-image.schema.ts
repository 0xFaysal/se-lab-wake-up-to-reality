import { z } from "zod";

const propertyIdParams = z.object({ propertyId: z.uuid() }).strict();

export const propertyImagePropertyIdSchema = z.object({
  params: propertyIdParams,
});

export const propertyImageIdSchema = z.object({
  params: propertyIdParams.extend({ imageId: z.uuid() }).strict(),
});

export const reorderPropertyImagesSchema = z.object({
  params: propertyIdParams,
  body: z
    .object({
      imageIds: z.array(z.uuid()).min(1).max(10),
      coverImageId: z.uuid().optional(),
    })
    .strict()
    .superRefine((data, context) => {
      if (new Set(data.imageIds).size !== data.imageIds.length) {
        context.addIssue({
          code: "custom",
          path: ["imageIds"],
          message: "Image IDs must not contain duplicates",
        });
      }
      if (
        data.coverImageId !== undefined &&
        !data.imageIds.includes(data.coverImageId)
      ) {
        context.addIssue({
          code: "custom",
          path: ["coverImageId"],
          message: "Cover image must be included in imageIds",
        });
      }
    }),
});
