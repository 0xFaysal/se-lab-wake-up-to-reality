import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.js";
import { requireAccountReady } from "../../common/middleware/require-account-ready.js";
import { requirePasswordChangeComplete } from "../../common/middleware/require-password-change-complete.js";
import { requireRole } from "../../common/middleware/require-role.js";
import { sensitiveAccountRateLimit } from "../../common/middleware/rate-limit.js";
import { validate } from "../../common/middleware/validate.js";
import {
  changePasswordController,
  createGuardController,
  listSessionsController,
  revokeSessionController,
} from "./users.controller.js";
import {
  changePasswordSchema,
  createGuardSchema,
  revokeSessionSchema,
} from "./users.schema.js";
import { UserRoleType } from "../../../generated/prisma/client.js";

export const usersRouter = Router();

usersRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
usersRouter.use(authenticate);

/**
 * @openapi
 * /api/v1/users/guards:
 *   post:
 *     tags: [User Account]
 *     summary: Invite a Guard
 *     operationId: createGuard
 *     description: |
 *       Creates a controlled Guard account and emails a single-use password
 *       setup link. Only a ready Parking Owner or Admin can use this
 *       endpoint. A plaintext temporary password is never created or returned.
 *     security:
 *       - accessCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGuardRequest'
 *     responses:
 *       201:
 *         description: Guard account created and invitation accepted for delivery.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GuardInvitationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Email or normalized phone is already registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 *       503:
 *         description: Invitation email delivery is unavailable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.post(
  "/guards",
  requireAccountReady,
  requireRole(UserRoleType.PARKING_OWNER, UserRoleType.ADMIN),
  sensitiveAccountRateLimit,
  validate(createGuardSchema),
  createGuardController,
);

/**
 * @openapi
 * /api/v1/users/me/change-password:
 *   post:
 *     tags: [User Account]
 *     summary: Change the authenticated user's password
 *     operationId: changePassword
 *     description: Verifies the current password, requires a different new password, revokes all old sessions, and issues a replacement authenticated session.
 *     security:
 *       - accessCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed and replacement auth cookies were set.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
usersRouter.post(
  "/me/change-password",
  requirePasswordChangeComplete,
  sensitiveAccountRateLimit,
  validate(changePasswordSchema),
  changePasswordController,
);

/**
 * @openapi
 * /api/v1/users/me/sessions:
 *   get:
 *     tags: [User Account]
 *     summary: List active login sessions
 *     operationId: listActiveSessions
 *     description: Returns only safe session metadata. Token and IP hashes are never exposed.
 *     security:
 *       - accessCookie: []
 *     responses:
 *       200:
 *         description: Active, non-expired sessions for the current user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   enum: [true]
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Session'
 *                   required: [sessions]
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *               required: [success, data, meta]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
usersRouter.get("/me/sessions", listSessionsController);

/**
 * @openapi
 * /api/v1/users/me/sessions/{sessionId}:
 *   delete:
 *     tags: [User Account]
 *     summary: Revoke one of the current user's sessions
 *     operationId: revokeSession
 *     description: Revoking the current session also clears its authentication cookies.
 *     security:
 *       - accessCookie: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         description: Refresh-session identifier.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Session revoked successfully.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Active session was not found for the authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
usersRouter.delete(
  "/me/sessions/:sessionId",
  sensitiveAccountRateLimit,
  validate(revokeSessionSchema),
  revokeSessionController,
);
