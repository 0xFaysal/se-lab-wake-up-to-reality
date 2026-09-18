import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import { guardInvitationRateLimit } from "../../common/middleware/rate-limit.js";
import { inviteGuardController } from "../guard-assignments/guard-assignment.controller.js";
import { createGuardInvitationSchema } from "../guard-assignments/guard-assignment.schema.js";
import { propertyImageRouter } from "../property-images/property-image.routes.js";
import {
  createPropertyController,
  deletePropertyController,
  findPossiblePropertyMatchesController,
  getPropertyController,
  listPropertiesController,
  updatePropertyController,
} from "./property.controller.js";
import {
  createPropertySchema,
  propertyDuplicateMatchSchema,
  propertyIdParamSchema,
  updatePropertySchema,
} from "./property.schema.js";

export const propertyRouter = Router();

propertyRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

propertyRouter.use(
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.PROVIDER),
);

/**
 * @openapi
 * /api/v1/provider/properties/{propertyId}/guard-invitations:
 *   post:
 *     tags: [Property Guards]
 *     summary: Invite a known Guard to a verified active Property
 *     deprecated: true
 *     operationId: invitePropertyGuard
 *     description: Compatibility alias for POST /api/v1/properties/{propertyId}/guards. It creates a shared Property Guard membership, not a Provider assignment.
 *     security: [{ accessCookie: [] }]
 *     parameters:
 *       - { name: propertyId, in: path, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateGuardInvitationRequest' }
 *     responses:
 *       201:
 *         description: Property Guard membership invitation created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PropertyGuardMembershipResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Property or eligible Guard was not found. }
 *       409: { description: Property is ineligible or a non-terminal assignment already exists. }
 *       429: { $ref: '#/components/responses/RateLimited' }
 */
propertyRouter.post(
  "/:propertyId/guard-invitations",
  guardInvitationRateLimit,
  validate(createGuardInvitationSchema),
  inviteGuardController,
);

propertyRouter.use(propertyImageRouter);

/**
 * @openapi
 * /api/v1/provider/properties/possible-matches:
 *   post:
 *     tags: [Properties]
 *     summary: Find possible canonical Property matches before creation
 *     description: Compares normalized identity and location signals so the Provider can reuse an existing canonical Property or explicitly continue with a different one.
 *     security:
 *       - accessCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, publicArea, approximateAddress, latitude, longitude]
 *             properties:
 *               name: { type: string }
 *               publicArea: { type: string }
 *               approximateAddress: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200: { description: Privacy-safe list of possible canonical Property matches. }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 * /api/v1/provider/properties:
 *   post:
 *     tags: [Properties]
 *     summary: Create a parking property
 *     operationId: createProviderProperty
 *     description: Requires a ready PROVIDER account. Exact address and access instructions are encrypted at rest. New properties start as PENDING and INACTIVE.
 *     security:
 *       - accessCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePropertyRequest'
 *     responses:
 *       201:
 *         description: Property created for Admin verification.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderPropertyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     tags: [Properties]
 *     summary: List the current Provider's Property memberships
 *     operationId: listProviderProperties
 *     description: Requires a ready PROVIDER account. Returns the Provider's Property memberships without selecting private encrypted fields.
 *     security:
 *       - accessCookie: []
 *     responses:
 *       200:
 *         description: Provider membership-scoped Property summaries.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderPropertyListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
propertyRouter.post(
  "/possible-matches",
  validate(propertyDuplicateMatchSchema),
  findPossiblePropertyMatchesController,
);
propertyRouter.post(
  "/",
  validate(createPropertySchema),
  createPropertyController,
);
propertyRouter.get("/", listPropertiesController);

/**
 * @openapi
 * /api/v1/provider/properties/{propertyId}:
 *   get:
 *     tags: [Properties]
 *     summary: Get a Provider membership-scoped Property
 *     operationId: getProviderProperty
 *     description: Returns membership-scoped details with decrypted exact address and access instructions. Inaccessible resources return 404.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Provider Property details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderPropertyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found in the authenticated Provider's scope.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Protected property data could not be decrypted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Properties]
 *     summary: Update a Provider Property
 *     operationId: updateProviderProperty
 *     description: Re-encrypts changed private fields with a fresh IV. Critical location changes reset verified properties to PENDING and INACTIVE. Owners cannot submit verification or operational fields.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePropertyRequest'
 *     responses:
 *       200:
 *         description: Property updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderPropertyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found in the authenticated Provider's scope.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Property cannot be edited in its current state.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Properties]
 *     summary: Delete a sole or provisional Provider Property
 *     operationId: deleteProviderProperty
 *     description: Soft-deletes an owned property when it has no images, existing parking spots, or blocking guard assignments.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Property deleted.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Property was not found for the authenticated owner.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Property has active dependent records.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
propertyRouter.get(
  "/:propertyId",
  validate(propertyIdParamSchema),
  getPropertyController,
);
propertyRouter.patch(
  "/:propertyId",
  validate(updatePropertySchema),
  updatePropertyController,
);
propertyRouter.delete(
  "/:propertyId",
  validate(propertyIdParamSchema),
  deletePropertyController,
);
