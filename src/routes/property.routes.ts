import { Router } from "express";
import { PropertyController } from "../controllers/property.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();
router.get("/search", PropertyController.search);
router.get("/featured", PropertyController.getFeatured);
router.get("/:id", PropertyController.getById);

router.post("/", authenticate, PropertyController.create);
router.put("/:id", authenticate, PropertyController.update);
router.delete("/:id", authenticate, PropertyController.delete);

export default router;
