import { Router } from "express";
import { registerSchema, loginSchema } from "@devboard/shared";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/requireAuth";
import { asyncHandler } from "../../utils/response";
import * as authController from "./auth.controller";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register)
);
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", requireAuth, asyncHandler(authController.me));

export default router;
