import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20).max(5000),
  type: z.string(),
  listing_type: z.string(),
  priceNaira: z.number().positive(),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().min(0).max(50),
  floorAreaSqm: z.number().positive(),
  is_furnished: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip_code: z.string().optional(),
    country: z.string().default("Nigeria"),
  }),
});

export const consultationLeadSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
  location: z.string().min(2, "Location is required"),
  interestType: z.enum(["Buy", "Sell", "Invest", "Rent", "Other"]),
  targetArea: z.enum([
    "Ikoyi",
    "Lekki",
    "Victoria Island",
    "Abuja",
    "Port Harcourt",
    "Other Lagos",
    "Not Sure Yet",
  ]),
  budgetRange: z.enum([
    "Below ₦30M",
    "₦30M–₦100M",
    "₦100M–₦300M",
    "₦300M+",
    "Prefer not to say",
  ]),
  timeline: z.enum(["Ready Now", "1–3 Months", "3–6 Months", "Just Exploring"]),
  notes: z.string().max(1000).optional(),
});

export const newsletterLeadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  segment: z.string().optional(),
  source: z.string().optional(),
});
