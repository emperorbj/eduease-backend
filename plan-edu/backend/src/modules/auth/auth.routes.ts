import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate.js";
import { User } from "../../models/User.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, try again later" },
});

async function registerAuthGate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if ((await User.countDocuments()) === 0) {
    next();
    return;
  }
  await authenticate(req, res, next);
}

authRouter.post(
  "/register",
  asyncHandler(registerAuthGate),
  asyncHandler(authController.register)
);
authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(authController.login)
);
authRouter.get("/me", authenticate, asyncHandler(authController.me));
