import { Router } from "express";
// import { consultationController } from "../controllers/consultation.controller";
import { validate } from "../middleware/validate";
import { consultationLeadSchema } from "../validators";

const router = Router();

router.post("/", validate(consultationLeadSchema), (req, res) => {});

export default router;
