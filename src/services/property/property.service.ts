import { prisma } from "../../config/database";
import { getCache, setCache, deleteCache } from "../../config/redis";
import { AppError } from "../../utils/AppError";
import { logger } from "../../config/logger";

const CACHE_PREFIX = "cache:property";

export class PropertyService {
  async getById(id: string) {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const property = await prisma.property.findUnique({
      where: { id, is_active: true },
      include: { address: true },
    });

    if (!property) throw new AppError("Property not found", 404);

    await setCache(cacheKey, property);
    return property;
  }

  async create(data: any) {
    const property = await prisma.property.create({
      data: {
        title: data.title,
        location: data.location,
        type: data.type,
        priceNaira: data.priceNaira,
        priceUsd: data.priceUsd,
        status: data.status || "active",
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        floorAreaSqm: data.floorAreaSqm,
        description: data.description,
        amenities: data.amenities,
        is_furnished: data.is_furnished,
        address: { create: data.address },
      },
    });

    logger.info("Property created", { propertyId: property.id });
    return property;
  }

  async update(id: string, data: any) {
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) throw new AppError("Property not found", 404);

    const updated = await prisma.property.update({
      where: { id },
      data: {
        title: data.title ?? property.title,
        description: data.description ?? property.description,
        priceNaira: data.priceNaira ?? property.priceNaira,
        status: data.status ?? property.status,
        amenities: data.amenities ?? property.amenities,
        updatedAt: new Date(),
      },
    });

    await deleteCache(`${CACHE_PREFIX}:${id}`);
    return updated;
  }

  async delete(id: string) {
    try {
      await prisma.property.update({
        where: { id },
        data: { is_active: false },
      });
      await deleteCache(`${CACHE_PREFIX}:${id}`);
    } catch {
      throw new AppError("Property not found", 404);
    }
  }

  async incrementViews(id: string) {
    await prisma.property.update({
      where: { id },
      data: { views_count: { increment: 1 } },
    });
  }

  async getFeatured(limit = 6) {
    const cacheKey = "cache:properties:featured";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const properties = await prisma.property.findMany({
      where: { is_featured: true, status: "active", is_active: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { address: true },
    });

    await setCache(cacheKey, properties, 1800);
    return properties;
  }
}

export const propertyService = new PropertyService();
