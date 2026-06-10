import { Router } from "express";

import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import projectRoutes from "./project.routes";
import consultationRoutes from "./consultation.routes";
import newsletterRoutes from "./newsletter.routes";
import insightRoutes from "./insight.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/projects", projectRoutes);
router.use("/consultations", consultationRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/insights", insightRoutes);

export default router;
