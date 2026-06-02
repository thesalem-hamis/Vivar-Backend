import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
const router = Router();

router.get("/me", authenticate, (_req, res) =>
  res.json({ success: true, message: "TODO: get own profile" }),
);
router.patch("/me", authenticate, (_req, res) =>
  res.json({ success: true, message: "TODO: update profile" }),
);
router.delete("/me", authenticate, (_req, res) =>
  res.json({ success: true, message: "TODO: deactivate account" }),
);
router.get("/:id", (_req, res) =>
  res.json({ success: true, message: "TODO: public user/agent profile" }),
);

export default router;
