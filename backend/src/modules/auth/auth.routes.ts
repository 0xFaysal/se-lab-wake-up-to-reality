import { Router } from "express";
import { authenticate } from "../../common/auth/auth.middleware.js";
import { validate } from "../../common/middleware/validate.js";
import {
  changeInitialPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./auth.controller.js";
import {
  changeInitialPasswordSchema,
  loginSchema,
  registerSchema,
} from "./auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), registerController);
authRouter.post("/login", validate(loginSchema), loginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", authenticate, meController);
authRouter.post(
  "/change-initial-password",
  authenticate,
  validate(changeInitialPasswordSchema),
  changeInitialPasswordController,
);
