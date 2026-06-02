import { Router } from "express";
const r = Router();
r.get("/", (_req, res) => res.json({ message: "review routes - TODO" }));
export default r;
