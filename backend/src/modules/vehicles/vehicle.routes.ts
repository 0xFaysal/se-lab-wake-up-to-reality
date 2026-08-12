import { Router } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { validate } from "../../common/middleware/validate.js";
import {
  createVehicleController,
  deleteVehicleController,
  getVehicleController,
  listVehiclesController,
  setDefaultVehicleController,
  updateVehicleController,
} from "./vehicle.controller.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from "./vehicle.schema.js";

export const vehicleRouter = Router();

vehicleRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

vehicleRouter.use(
  authenticate,
  requireAccountReady,
  requireRole(UserRoleType.DRIVER),
);

/**
 * @openapi
 * /api/v1/vehicles:
 *   post:
 *     tags: [Vehicles]
 *     summary: Register a vehicle
 *     operationId: createVehicle
 *     description: Requires a fully verified DRIVER account. The first active vehicle becomes the default automatically. Registration uniqueness is checked after case, whitespace, and dash normalization.
 *     security:
 *       - accessCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVehicleRequest'
 *     responses:
 *       201:
 *         description: Vehicle registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Normalized registration number already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags: [Vehicles]
 *     summary: List the current Driver's vehicles
 *     operationId: listVehicles
 *     description: Requires a fully verified DRIVER account. Deleted vehicles are excluded; the default vehicle is returned first, followed by newest vehicles.
 *     security:
 *       - accessCookie: []
 *     responses:
 *       200:
 *         description: Active vehicles owned by the authenticated Driver.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
vehicleRouter.post("/", validate(createVehicleSchema), createVehicleController);
vehicleRouter.get("/", listVehiclesController);

/**
 * @openapi
 * /api/v1/vehicles/{vehicleId}/default:
 *   patch:
 *     tags: [Vehicles]
 *     summary: Set a vehicle as default
 *     operationId: setDefaultVehicle
 *     description: Requires a fully verified DRIVER account. The operation atomically removes the previous default and assigns this owned, active vehicle.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: vehicleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Default vehicle updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Vehicle was not found for the authenticated Driver.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
vehicleRouter.patch(
  "/:vehicleId/default",
  validate(vehicleIdParamSchema),
  setDefaultVehicleController,
);

/**
 * @openapi
 * /api/v1/vehicles/{vehicleId}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get one owned vehicle
 *     operationId: getVehicle
 *     description: Requires a fully verified DRIVER account. A missing, deleted, or another Driver's vehicle returns the same 404 response.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: vehicleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Owned vehicle found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Vehicle was not found for the authenticated Driver.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Vehicles]
 *     summary: Update an owned vehicle
 *     operationId: updateVehicle
 *     description: Requires a fully verified DRIVER account. Verification status and default selection cannot be changed through this endpoint.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: vehicleId
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
 *             $ref: '#/components/schemas/UpdateVehicleRequest'
 *     responses:
 *       200:
 *         description: Vehicle updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Vehicle was not found for the authenticated Driver.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Normalized registration number already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Vehicles]
 *     summary: Delete an owned vehicle
 *     operationId: deleteVehicle
 *     description: Soft-deletes an active vehicle. If it was the default, the newest remaining active vehicle becomes default. Requires a fully verified DRIVER account.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: vehicleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Vehicle deleted.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Vehicle was not found for the authenticated Driver.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Vehicle deletion is blocked by its current state.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
vehicleRouter.get(
  "/:vehicleId",
  validate(vehicleIdParamSchema),
  getVehicleController,
);
vehicleRouter.patch(
  "/:vehicleId",
  validate(updateVehicleSchema),
  updateVehicleController,
);
vehicleRouter.delete(
  "/:vehicleId",
  validate(vehicleIdParamSchema),
  deleteVehicleController,
);
