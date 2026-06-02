import { Router } from "express";
import { searchService } from "../services/search/search.service";
const router = Router();
router.get("/", async (req, res, next) => {
  try {
    const filters = req.query as any;
    const results = await searchService.search(filters);
    res.json(results);
  } catch (err) {
    next(err);
  }
});
export default router;
