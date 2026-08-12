import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import {
  changeInitialPasswordController,
  confirmEmailVerificationController,
  confirmPhoneVerificationController,
  loginController,
  logoutAllController,
  logoutController,
  meController,
  refreshController,
  registerController,
  requestEmailVerificationController,
  requestPasswordResetController,
  requestPhoneVerificationController,
  resetPasswordController,
} from "./auth.controller.js";
import {
  loginRateLimit,
  refreshRateLimit,
  registerRateLimit,
  sensitiveAccountRateLimit,
  passwordResetRateLimit,
  verificationConfirmRateLimit,
  verificationRequestRateLimit,
} from "../../common/middleware/rate-limit.js";
import {
  changeInitialPasswordSchema,
  confirmVerificationSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new Driver or Parking Owner
 *     operationId: registerUser
 *     description: |
 *       Creates a self-registered ParkEase account. Public registration allows
 *       only DRIVER and PARKING_OWNER roles. Successful registration creates the
 *       role, BDT wallet, required legal acceptances, and an authenticated session.
 *       Access and refresh tokens are issued as HttpOnly cookies. The account is
 *       PENDING until mandatory email verification. Phone verification is
 *       optional and does not block account access.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful and authenticated session created.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: Contains access_token and refresh_token HttpOnly cookies.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Email or normalized phone is already registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post(
  "/register",
  registerRateLimit,
  validate(registerSchema),
  registerController,
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in using email or phone
 *     operationId: loginUser
 *     description: |
 *       Authenticates any ParkEase role using an email address or Bangladesh
 *       mobile number. Successful login issues HttpOnly access and refresh
 *       cookies. PENDING users may log in to finish mandatory email verification.
 *       The nextAction field guides initial-password and email requirements.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authentication successful and auth cookies set.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post(
  "/login",
  loginRateLimit,
  validate(loginSchema),
  loginController,
);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Rotate the refresh session
 *     operationId: refreshSession
 *     description: Uses the HttpOnly refresh cookie, atomically revokes the old session, and issues a replacement token pair. Reusing an already-rotated refresh token is rejected.
 *     security:
 *       - refreshCookie: []
 *     responses:
 *       200:
 *         description: Session rotated and replacement cookies set.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post("/refresh", refreshRateLimit, refreshController);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Log out the current session
 *     operationId: logoutCurrentSession
 *     security:
 *       - refreshCookie: []
 *     responses:
 *       204:
 *         description: Current session revoked when present and cookies cleared.
 */
authRouter.post("/logout", logoutController);

/**
 * @openapi
 * /api/v1/auth/logout-all:
 *   post:
 *     tags: [Authentication]
 *     summary: Log out all active sessions
 *     operationId: logoutAllSessions
 *     security:
 *       - accessCookie: []
 *     responses:
 *       204:
 *         description: All sessions belonging to the user were revoked and cookies cleared.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
authRouter.post("/logout-all", authenticate, logoutAllController);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get the authenticated user
 *     operationId: getCurrentUser
 *     security:
 *       - accessCookie: []
 *     responses:
 *       200:
 *         description: Current authenticated user.
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
 *                     user:
 *                       $ref: '#/components/schemas/AuthUser'
 *                   required: [user]
 *                 meta:
 *                   $ref: '#/components/schemas/Meta'
 *               required: [success, data, meta]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
authRouter.get("/me", authenticate, meController);

/**
 * @openapi
 * /api/v1/auth/change-initial-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Replace an Admin or Guard initial password
 *     operationId: changeInitialPassword
 *     description: Used by controlled Guard accounts during first login when mustChangePassword is true. Previous sessions are revoked and a new authenticated session is issued.
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
 *         description: Initial password replaced and replacement auth cookies set.
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
authRouter.post(
  "/change-initial-password",
  authenticate,
  sensitiveAccountRateLimit,
  validate(changeInitialPasswordSchema),
  changeInitialPasswordController,
);

/**
 * @openapi
 * /api/v1/auth/request-password-reset:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a password reset
 *     operationId: requestPasswordReset
 *     description: Always returns a generic response to prevent account enumeration. Reset instructions are emailed through the configured SMTP provider. The token is returned only when EXPOSE_DEVELOPMENT_AUTH_CODES=true.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       202:
 *         description: Password-reset processing accepted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetAcceptedResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post(
  "/request-password-reset",
  passwordResetRateLimit,
  validate(requestPasswordResetSchema),
  requestPasswordResetController,
);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Complete a password reset
 *     operationId: resetPassword
 *     description: Consumes the one-time reset token and revokes all existing sessions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post(
  "/reset-password",
  passwordResetRateLimit,
  validate(resetPasswordSchema),
  resetPasswordController,
);

/**
 * @openapi
 * /api/v1/auth/email-verification/request:
 *   post:
 *     tags: [Authentication]
 *     summary: Request an email verification code
 *     operationId: requestEmailVerification
 *     description: Generates a six-digit code, stores only its HMAC in Redis, and sends the code to the authenticated user's registered email through SMTP. The code is returned only when EXPOSE_DEVELOPMENT_AUTH_CODES=true.
 *     security:
 *       - accessCookie: []
 *     responses:
 *       202:
 *         description: Verification request accepted or email already verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationRequestResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 *       503:
 *         description: SMTP email delivery is unavailable or not configured.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRouter.post(
  "/email-verification/request",
  authenticate,
  verificationRequestRateLimit,
  requestEmailVerificationController,
);

/**
 * @openapi
 * /api/v1/auth/email-verification/confirm:
 *   post:
 *     tags: [Authentication]
 *     summary: Confirm the authenticated user's email code
 *     operationId: confirmEmailVerification
 *     security:
 *       - accessCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificationCodeRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationConfirmedResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post(
  "/email-verification/confirm",
  authenticate,
  verificationConfirmRateLimit,
  validate(confirmVerificationSchema),
  confirmEmailVerificationController,
);

/**
 * @openapi
 * /api/v1/auth/phone-verification/request:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a phone verification code
 *     operationId: requestPhoneVerification
 *     description: Optional account-strengthening step. It does not block normal account access. Stores only an HMAC of the six-digit code in Redis and sends it through Twilio Programmable Messaging. The code is returned only when EXPOSE_DEVELOPMENT_AUTH_CODES=true.
 *     security:
 *       - accessCookie: []
 *     responses:
 *       202:
 *         description: Verification request accepted or phone already verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationRequestResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post(
  "/phone-verification/request",
  authenticate,
  verificationRequestRateLimit,
  requestPhoneVerificationController,
);

/**
 * @openapi
 * /api/v1/auth/phone-verification/confirm:
 *   post:
 *     tags: [Authentication]
 *     summary: Confirm the authenticated user's optional phone code
 *     operationId: confirmPhoneVerification
 *     security:
 *       - accessCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificationCodeRequest'
 *     responses:
 *       200:
 *         description: Phone verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationConfirmedResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
authRouter.post(
  "/phone-verification/confirm",
  authenticate,
  verificationConfirmRateLimit,
  validate(confirmVerificationSchema),
  confirmPhoneVerificationController,
);
