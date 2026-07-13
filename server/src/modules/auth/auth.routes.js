import { Router } from "express";
import rateLimit from "express-rate-limit";
import validate from "../../middlewares/validate.js";
import asyncHandler from "../../errors/asyncHandler.js";
import authController from "./auth.controller.js";
import { signupSchema, loginSchema } from "../../validators/auth.validator.js";
import config from "../../config/env.js";

const router = Router();

// Slows down credential-stuffing / brute-force attempts against auth endpoints.
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

router.use(authLimiter);

router.post("/signup", validate(signupSchema), asyncHandler(authController.signup));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));

export default router;
