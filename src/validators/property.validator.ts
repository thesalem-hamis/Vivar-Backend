import { z } from "zod";
import {
  PropertyType,
  PropertySubType,
  Purpose,
  FurnishingStatus,
  Condition,
  Currency,
  PaymentPeriod,
  PowerSupply,
  AmenityType,
} from "@prisma/client";

const locationSchema = z.object({
  state: z.string({ error: "State is required" }),
  lga: z.string({ error: "LGA is required" }),
  localityArea: z.string({ error: "Locality area is required" }),
  estateName: z.string().optional(),
  streetAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const pricingSchema = z.object({
  currency: z.nativeEnum(Currency).optional().default(Currency.NGN),
  price: z.number({ error: "Price is required" }).positive(),
  paymentPeriod: z.nativeEnum(PaymentPeriod, {
    error: "Payment period is required",
  }),
  serviceCharge: z.number().nonnegative().optional(),
  agencyFeePercentage: z.number().nonnegative().max(100).optional(),
  legalFeePercentage: z.number().nonnegative().max(100).optional(),
  cautionFee: z.number().nonnegative().optional(),
});

const amenitiesSchema = z.object({
  isServiced: z.boolean().optional().default(false),
  hasBq: z.boolean().optional().default(false),
  powerSupply: z.nativeEnum(PowerSupply).optional(),
  amenityList: z.array(z.nativeEnum(AmenityType)).optional(),
});

export const createPropertySchema = z.object({
  body: z.object({
    title: z
      .string({ error: "Title is required" })
      .min(5, "Title must be at least 5 characters"),
    description: z.string().optional(),
    propertyType: z.nativeEnum(PropertyType, {
      error: "Property type is required",
    }),
    propertySubType: z.nativeEnum(PropertySubType, {
      error: "Property sub-type is required",
    }),
    purpose: z.nativeEnum(Purpose, { error: "Purpose is required" }),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    floorAreaSqm: z.number().positive().optional(),
    furnishingStatus: z.nativeEnum(FurnishingStatus).optional(),
    condition: z.nativeEnum(Condition).optional(),
    isActive: z.boolean().optional(),

    location: locationSchema,
    pricing: pricingSchema,
    amenities: amenitiesSchema,
  }),
});

export const updatePropertySchema = z.object({
  body: createPropertySchema.shape.body.partial(),
  params: z.object({
    id: z.string().uuid("Invalid property ID format"),
  }),
});

export const propertyIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid property ID format"),
  }),
});
