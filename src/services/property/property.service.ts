import { Prisma } from "../../generated/prisma";
import { createClient } from "redis";
import {
  CreatePropertyDTO,
  PropertySearchFilters,
} from "../../types/property.types";
import { prisma } from "../../config/database";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.connect().catch(console.error);

const generateCacheKey = (filters: Record<string, any>): string => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v != null && v !== ""),
  );
  const sortedKeys = Object.keys(cleanFilters).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${cleanFilters[key]}`)
    .join("&");
  return `search:properties:${queryString || "all"}`;
};

const invalidateCaches = async () => {
  try {
    await redisClient.del("search:properties:all");
    await redisClient.del("properties:featured");
  } catch (e) {
    console.error("Redis Cache Deletion Error:", e);
  }
};

export class PropertyService {
  static async createProperty(data: CreatePropertyDTO) {
    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        propertySubType: data.propertySubType,
        purpose: data.purpose,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        floorAreaSqm: data.floorAreaSqm,
        furnishingStatus: data.furnishingStatus,
        condition: data.condition,
        isActive: data.isActive ?? true,

        location: {
          create: data.location,
        },
        pricing: {
          create: data.pricing,
        },
        amenities: {
          create: data.amenities,
        },
      },
      include: {
        location: true,
        pricing: true,
        amenities: true,
      },
    });

    try {
      await redisClient.del("search:properties:all");
    } catch (e) {
      console.error("Redis Cache Deletion Error:", e);
    }

    return property;
  }

  static async getFeaturedProperties() {
    const cacheKey = "properties:featured";

    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        console.log("Cache HIT for Featured Properties");
        return JSON.parse(cachedResult);
      }
    } catch (error) {
      console.error("Redis Get Error:", error);
    }

    const featuredProperties = await prisma.property.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        isVerified: true,
      },
      include: { location: true, pricing: true, amenities: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    try {
      await redisClient.set(cacheKey, JSON.stringify(featuredProperties), {
        EX: 3600,
      });
    } catch (error) {
      console.error("Redis Set Error:", error);
    }

    return featuredProperties;
  }

  static async getPropertyById(id: string) {
    const property = await prisma.property.update({
      where: { id },
      data: {
        viewsCount: { increment: 1 },
      },
      include: {
        location: true,
        pricing: true,
        amenities: true,
      },
    });

    if (!property) throw new Error("Property not found");
    return property;
  }

  static async searchProperties(filters: PropertySearchFilters = {}) {
    const cacheKey = generateCacheKey(filters);

    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) return JSON.parse(cachedResult);
    } catch (redisError) {
      console.error("Redis Get Error:", redisError);
    }

    const where: Prisma.PropertyWhereInput = {
      isActive: true,
      isVerified: true,
    };

    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: "insensitive" } },
        { description: { contains: filters.searchQuery, mode: "insensitive" } },
        {
          location: {
            is: {
              estateName: {
                contains: filters.searchQuery,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    if (filters.purpose) where.purpose = filters.purpose;
    if (filters.propertyType) where.propertyType = filters.propertyType;
    if (filters.propertySubType)
      where.propertySubType = filters.propertySubType;
    if (filters.bedrooms) where.bedrooms = { gte: Number(filters.bedrooms) };

    if (filters.state || filters.localityArea) {
      where.location = {
        ...(filters.state && {
          state: { equals: filters.state, mode: "insensitive" },
        }),
        ...(filters.localityArea && {
          localityArea: { contains: filters.localityArea, mode: "insensitive" },
        }),
      };
    }

    if (filters.minPrice || filters.maxPrice) {
      where.pricing = {
        price: {
          ...(filters.minPrice && { gte: Number(filters.minPrice) }),
          ...(filters.maxPrice && { lte: Number(filters.maxPrice) }),
        },
      };
    }

    if (filters.isServiced !== undefined || filters.hasBq !== undefined) {
      where.amenities = {
        ...(filters.isServiced !== undefined && {
          isServiced: String(filters.isServiced) === "true",
        }),
        ...(filters.hasBq !== undefined && {
          hasBq: String(filters.hasBq) === "true",
        }),
      };
    }

    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);
    const skip = (page - 1) * limit;

    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { location: true, pricing: true, amenities: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    const result = {
      data: properties,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });
    } catch (redisError) {
      console.error("Redis Set Error:", redisError);
    }

    return result;
  }

  static async updateProperty(
    id: string,
    data: Partial<CreatePropertyDTO> & { isFeatured?: boolean },
  ) {
    const updateData: Prisma.PropertyUpdateInput = {
      title: data.title,
      description: data.description,
      propertyType: data.propertyType,
      propertySubType: data.propertySubType,
      purpose: data.purpose,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      floorAreaSqm: data.floorAreaSqm,
      furnishingStatus: data.furnishingStatus,
      condition: data.condition,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
    };

    if (data.location) updateData.location = { update: data.location };
    if (data.pricing) updateData.pricing = { update: data.pricing };
    if (data.amenities) updateData.amenities = { update: data.amenities };

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: { location: true, pricing: true, amenities: true },
    });

    await invalidateCaches();
    return property;
  }

  static async deleteProperty(id: string) {
    const property = await prisma.property.delete({
      where: { id },
    });

    await invalidateCaches();
    return property;
  }
}
