import { Request, Response, NextFunction } from "express";
import { propertyService } from "../services/property/property.service";

export class PropertyController {
  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const property = await propertyService.getById(id);
      propertyService
        .incrementViews(id)
        .catch((err) => console.error("View increment failed", err));
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
      const property = await propertyService.create(req.body);
      res.status(201).json({ success: true, data: property });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const property = await propertyService.update(id, req.body);
      res.json({ success: true, data: property });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await propertyService.delete(id);
      res.json({ success: true, message: "Property deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const propertyController = new PropertyController();
