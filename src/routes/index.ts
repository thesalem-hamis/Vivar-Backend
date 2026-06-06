import { Router } from "express";

import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import agentRoutes from "./agent.routes";
import bookingRoutes from "./booking.routes";
import propertyRoutes from "./property.routes";
import reviewRoutes from "./review.routes";
import searchRoutes from "./search.routes";
import uploadRoutes from "./upload.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/agents", agentRoutes);
router.use("/bookings", bookingRoutes);
router.use("/properties", propertyRoutes);
router.use("/reviews", reviewRoutes);
router.use("/search", searchRoutes);
router.use("/uploads", uploadRoutes);
router.use("/users", userRoutes);

export default router;
