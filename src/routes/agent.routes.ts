import { Router } from "express";
const r = Router();
r.get("/", (_req, res) => res.json({ message: "agent routes - TODO" }));
export default r;
