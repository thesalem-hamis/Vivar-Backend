import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === "/health") return next();

  const start = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      user_id: req.user?.sub ?? "anonymous",
    });
  });

  next();
}
