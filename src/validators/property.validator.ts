import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { PropertyType, ListingType } from "../types";

const schemas: Record<string, Joi.ObjectSchema> = {
  createProperty: Joi.object({
    title: Joi.string().min(10).max(200).required(),
    description: Joi.string().min(20).max(5000).required(),
    type: Joi.string()
      .valid(...Object.values(PropertyType))
      .required(),
    listing_type: Joi.string()
      .valid(...Object.values(ListingType))
      .required(),
    price: Joi.number().positive().required(),
    bedrooms: Joi.number().integer().min(0).max(50).required(),
    bathrooms: Joi.number().min(0).max(50).required(),
    area_sqft: Joi.number().positive().required(),
    lot_size_sqft: Joi.number().positive().optional(),
    year_built: Joi.number()
      .integer()
      .min(1800)
      .max(new Date().getFullYear())
      .optional(),
    parking_spaces: Joi.number().integer().min(0).default(0),
    is_furnished: Joi.boolean().default(false),
    amenities: Joi.array().items(Joi.string()).default([]),
    virtual_tour_url: Joi.string().uri().optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip_code: Joi.string().required(),
      country: Joi.string().default("US"),
    }).required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).required(),
  }),
};

export function validateBody(schemaName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schema = schemas[schemaName];
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((d) => d.message),
      });
      return;
    }

    req.body = value;
    next();
  };
}
