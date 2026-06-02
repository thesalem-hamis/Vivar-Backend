import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  authController.register.bind(authController),
);
router.post(
  "/login",
  authRateLimiter,
  authController.login.bind(authController),
);
router.post("/refresh", authController.refresh.bind(authController));
router.post(
  "/logout",
  authenticate,
  authController.logout.bind(authController),
);

export default router;
