import { Router } from "express";
import { propertyImageUpload } from "../../common/uploads/image-upload.middleware.js";
import { validate } from "../../common/middleware/validate.js";
import {
  deletePropertyImageController,
  listPropertyImagesController,
  reorderPropertyImagesController,
  uploadPropertyImagesController,
} from "./property-image.controller.js";
import {
  propertyImageIdSchema,
  propertyImagePropertyIdSchema,
  reorderPropertyImagesSchema,
} from "./property-image.schema.js";

export const propertyImageRouter = Router();

/**
 * @openapi
 * /api/v1/owner/properties/{propertyId}/images:
 *   post:
 *     tags: [Property Images]
 *     summary: Upload images for an owned Property
 *     operationId: uploadOwnerPropertyImages
 *     description: Requires a ready PARKING_OWNER account. Accepts up to 10 valid JPEG, PNG, or WebP files, each no larger than 5 MB. File signatures are checked and metadata is stripped during storage.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 10
 *                 items: { type: string, format: binary }
 *             required: [images]
 *     responses:
 *       201:
 *         description: Images uploaded. The first Property image becomes the cover.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyImagesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found for the authenticated owner.
 *       409:
 *         description: The 10-image Property limit would be exceeded.
 *       413:
 *         description: An image exceeds 5 MB.
 *       415:
 *         description: A declared or detected image type is unsupported.
 *       502:
 *         description: External image storage failed.
 *   get:
 *     tags: [Property Images]
 *     summary: List images for an owned Property
 *     operationId: listOwnerPropertyImages
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Ordered Property images without internal storage IDs.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyImagesResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found for the authenticated owner.
 */
propertyImageRouter.post(
  "/:propertyId/images",
  validate(propertyImagePropertyIdSchema),
  propertyImageUpload,
  uploadPropertyImagesController,
);
propertyImageRouter.get(
  "/:propertyId/images",
  validate(propertyImagePropertyIdSchema),
  listPropertyImagesController,
);

/**
 * @openapi
 * /api/v1/owner/properties/{propertyId}/images/reorder:
 *   patch:
 *     tags: [Property Images]
 *     summary: Reorder images and select the cover
 *     operationId: reorderOwnerPropertyImages
 *     description: imageIds must contain every current Property image exactly once. coverImageId, when supplied, must be in imageIds.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyImageReorderRequest'
 *     responses:
 *       200:
 *         description: Updated image order and cover.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyImagesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found for the authenticated owner.
 */
propertyImageRouter.patch(
  "/:propertyId/images/reorder",
  validate(reorderPropertyImagesSchema),
  reorderPropertyImagesController,
);

/**
 * @openapi
 * /api/v1/owner/properties/{propertyId}/images/{imageId}:
 *   delete:
 *     tags: [Property Images]
 *     summary: Delete an owned Property image
 *     operationId: deleteOwnerPropertyImage
 *     description: Deletes the Cloudinary asset before its database row. Deleting the cover promotes the first remaining image and sort orders are normalized. Removing the final image from a VERIFIED Property returns it to PENDING and INACTIVE.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Image deleted.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property or image was not found for the authenticated owner.
 *       502:
 *         description: External image deletion failed and the database row was retained.
 */
propertyImageRouter.delete(
  "/:propertyId/images/:imageId",
  validate(propertyImageIdSchema),
  deletePropertyImageController,
);
