import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import {
  createPropertyController,
  deletePropertyController,
  getPropertyController,
  listPropertiesController,
  updatePropertyController,
} from "./property.controller.js";
import {
  createPropertySchema,
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
  requireRole(UserRoleType.PARKING_OWNER),
);

/**
 * @openapi
 * /api/v1/owner/properties:
 *   post:
 *     tags: [Properties]
 *     summary: Create a parking property
 *     operationId: createOwnerProperty
 *     description: Requires a fully verified PARKING_OWNER account. Exact address and access instructions are encrypted at rest. New properties start as PENDING and INACTIVE.
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
 *               $ref: '#/components/schemas/OwnerPropertyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     tags: [Properties]
 *     summary: List the current owner's properties
 *     operationId: listOwnerProperties
 *     description: Requires a fully verified PARKING_OWNER account. Returns newest active records first without decrypting or selecting private address fields.
 *     security:
 *       - accessCookie: []
 *     responses:
 *       200:
 *         description: Owner property summaries.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OwnerPropertyListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
propertyRouter.post(
  "/",
  validate(createPropertySchema),
  createPropertyController,
);
propertyRouter.get("/", listPropertiesController);

/**
 * @openapi
 * /api/v1/owner/properties/{propertyId}:
 *   get:
 *     tags: [Properties]
 *     summary: Get an owned property
 *     operationId: getOwnerProperty
 *     description: Returns owner-only details with decrypted exact address and access instructions. Missing, deleted, and cross-owner resources all return 404.
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
 *         description: Owned property details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OwnerPropertyResponse'
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
 *       500:
 *         description: Protected property data could not be decrypted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Properties]
 *     summary: Update an owned property
 *     operationId: updateOwnerProperty
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
 *               $ref: '#/components/schemas/OwnerPropertyResponse'
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
 *         description: Property cannot be edited in its current state.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Properties]
 *     summary: Delete an owned property
 *     operationId: deleteOwnerProperty
 *     description: Soft-deletes an owned property when it has no existing parking spots or blocking guard assignments.
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
