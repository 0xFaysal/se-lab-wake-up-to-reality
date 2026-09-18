import { Router } from "express";
import { UserRoleType } from "../../../../generated/prisma/client.js";
import { authenticate } from "../../../common/middleware/auth.js";
import { requireAccountReady } from "../../../common/middleware/require-account-ready.js";
import { requireRole } from "../../../common/middleware/require-role.js";
import { sensitiveAccountRateLimit } from "../../../common/middleware/rate-limit.js";
import { validate } from "../../../common/middleware/validate.js";
import {
  getAdminPropertyController,
  listPendingPropertiesController,
  verifyAdminPropertyController,
  mergeAdminPropertiesController,
  mergeAdminPropertyByIdController,
  previewAdminPropertyMergeController,
} from "./admin-property.controller.js";
import {
  adminPropertyIdSchema,
  pendingAdminPropertiesSchema,
  verifyAdminPropertySchema,
  mergeAdminPropertiesSchema,
  mergeAdminPropertyByIdSchema,
  mergeAdminPropertyPreviewSchema,
} from "./admin-property.schema.js";

export const adminPropertyRouter = Router();

adminPropertyRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

adminPropertyRouter.use(
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.ADMIN),
);

/**
 * @openapi
 * /api/v1/admin/properties/pending:
 *   get:
 *     tags: [Admin Properties]
 *     summary: List Properties pending verification
 *     operationId: listPendingAdminProperties
 *     description: Requires a ready ADMIN account. The oldest pending Properties are returned first.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated pending verification queue.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPendingPropertiesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminPropertyRouter.get(
  "/pending",
  validate(pendingAdminPropertiesSchema),
  listPendingPropertiesController,
);

/** @openapi
 * /api/v1/admin/properties/merge:
 *   post:
 *     tags: [Admin Properties]
 *     summary: Merge a duplicate Property into its canonical Property
 *     deprecated: true
 *     description: Preserves provider, Guard, image, and parking-resource records. Both Property versions are required for optimistic concurrency.
 *     security: [{ accessCookie: [] }]
 *     responses:
 *       200: { description: Duplicate Property archived and linked to the canonical Property. }
 *       409: { description: Version conflict or overlapping provider/Guard memberships require manual resolution. }
 */
adminPropertyRouter.post(
  "/merge",
  sensitiveAccountRateLimit,
  validate(mergeAdminPropertiesSchema),
  mergeAdminPropertiesController,
);

adminPropertyRouter.get(
  "/:duplicateId/merge-preview",
  validate(mergeAdminPropertyPreviewSchema),
  previewAdminPropertyMergeController,
);

/** @openapi
 * /api/v1/admin/properties/{duplicateId}/merge:
 *   post:
 *     tags: [Admin Properties]
 *     summary: Merge a duplicate Property into its canonical Property
 *     description: Canonical merge endpoint. Preserves current relationships, archives the duplicate, and requires optimistic versions for both records.
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: duplicateId, in: path, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AdminPropertyMergeRequest' }
 *     responses:
 *       200: { description: Duplicate Property archived and linked to the canonical Property. }
 *       409: { description: Version conflict or overlapping relationships require manual resolution. }
 */
adminPropertyRouter.post(
  "/:duplicateId/merge",
  sensitiveAccountRateLimit,
  validate(mergeAdminPropertyByIdSchema),
  mergeAdminPropertyByIdController,
);

/**
 * @openapi
 * /api/v1/admin/properties/{propertyId}:
 *   get:
 *     tags: [Admin Properties]
 *     summary: Get Property verification detail
 *     operationId: getAdminPropertyDetail
 *     description: Returns creator and provider identity, decrypted private location data, and images without exposing ciphertext, IVs, tags, or storage public IDs.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full Property review detail.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPropertyResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found.
 *       500:
 *         description: Protected Property data could not be decrypted.
 */
adminPropertyRouter.get(
  "/:propertyId",
  validate(adminPropertyIdSchema),
  getAdminPropertyController,
);

/**
 * @openapi
 * /api/v1/admin/properties/{propertyId}/verification:
 *   patch:
 *     tags: [Admin Properties]
 *     summary: Approve or reject a pending Property
 *     operationId: verifyAdminProperty
 *     description: Only PENDING Properties can transition. Approval requires a ready creating Provider, valid protected location data, valid coordinates, and at least one image. Concurrent decisions are serialized and conditionally updated.
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
 *             $ref: '#/components/schemas/PropertyVerificationRequest'
 *     responses:
 *       200:
 *         description: Verification decision persisted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyVerificationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found.
 *       409:
 *         description: Requirements are unmet, Property is already verified, or another decision won the race.
 */
adminPropertyRouter.patch(
  "/:propertyId/verification",
  sensitiveAccountRateLimit,
  validate(verifyAdminPropertySchema),
  verifyAdminPropertyController,
);
