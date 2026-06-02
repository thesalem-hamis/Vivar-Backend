import { Request, Response, NextFunction } from "express";
import { propertyService } from "../services/property/property.service";

export class PropertyController {
  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const property = await propertyService.getById(id);
      await propertyService.incrementViews(id);
      res.json({ success: true, data: property });
    } catch (err) {
      next(err);
    }
  }

  async getFeatured(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || "6", 10);
      const data = await propertyService.getFeatured(limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await propertyService.create(req.user!.sub, req.body);
      res.status(201).json({ success: true, data: property });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const property = await propertyService.update(
        id,
        req.user!.sub,
        req.body,
      );
      res.json({ success: true, data: property });
    } catch (err) {
      next(err);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      await propertyService.delete(id, req.user!.sub);
      res.json({ success: true, message: "Property deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const propertyController = new PropertyController();
