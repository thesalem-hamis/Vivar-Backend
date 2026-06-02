import { Router } from "express";
import { propertyController } from "../controllers/property.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validateBody } from "../validators/property.validator";

const router = Router();

router.get(
  "/featured",
  propertyController.getFeatured.bind(propertyController),
);
router.get("/:id", propertyController.getById.bind(propertyController));

router.post(
  "/",
  authenticate,
  authorize("agent", "admin"),
  validateBody("createProperty"),
  propertyController.create.bind(propertyController),
);

router.patch(
  "/:id",
  authenticate,
  authorize("agent", "admin"),
  propertyController.update.bind(propertyController),
);

router.delete(
  "/:id",
  authenticate,
  authorize("agent", "admin"),
  propertyController.delete.bind(propertyController),
);

export default router;
