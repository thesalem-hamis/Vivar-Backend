import { Request, Response } from "express";
import { PropertyService } from "../services/property/property.service";
import {
  CreatePropertyDTO,
  PropertySearchFilters,
} from "../types/property.types";

export class PropertyController {
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = req.body as CreatePropertyDTO;

      const property = await PropertyService.createProperty(data);

      return res.status(201).json({
        success: true,
        message: "Property created successfully",
        data: property,
      });
    } catch (error: any) {
      console.error("Create Property Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create property",
      });
    }
  }

  static async getFeatured(req: Request, res: Response): Promise<Response> {
    try {
      const featured = await PropertyService.getFeaturedProperties();
      return res.status(200).json({ success: true, data: featured });
    } catch (error: any) {
      console.error("Fetch Featured Properties Error:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch featured properties",
        });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const property = await PropertyService.getPropertyById(id as string);

      return res.status(200).json({
        success: true,
        data: property,
      });
    } catch (error: any) {
      if (error.message === "Property not found") {
        return res
          .status(404)
          .json({ success: false, message: "Property not found" });
      }
      console.error("Fetch Property Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch property details" });
    }
  }

  static async search(req: Request, res: Response): Promise<Response> {
    try {
      const filters = req.query as unknown as PropertySearchFilters;

      const result = await PropertyService.searchProperties(filters);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("Search Properties Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to search properties" });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = req.body as Partial<CreatePropertyDTO>;

      const property = await PropertyService.updateProperty(id as string, data);

      return res.status(200).json({
        success: true,
        message: "Property updated successfully",
        data: property,
      });
    } catch (error: any) {
      console.error("Update Property Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update property" });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await PropertyService.deleteProperty(id as string);

      return res.status(200).json({
        success: true,
        message: "Property deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete Property Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete property" });
    }
  }
}
