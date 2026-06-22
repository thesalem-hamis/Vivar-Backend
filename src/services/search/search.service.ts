import crypto from "crypto";
import { prisma } from "../../config/database";
import { getCache, setCache } from "../../config/redis";
import {
  Property,
  PropertySearchFilters,
  PaginatedResponse,
} from "../../types";

const SEARCH_CACHE_TTL = 300;

export class SearchService {
  async search(
    filters: PropertySearchFilters,
  ): Promise<PaginatedResponse<any>> {
    const cacheKey = `cache:search:${this.hashFilters(filters)}`;
    const cached = await getCache<PaginatedResponse<any>>(cacheKey);
    if (cached) return cached;

    const {
      page = 1,
      limit = 20,
      sort_by = "newest",
      query,
      ...rest
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      is_active: true,
      status: "active",
      type: rest.type,
      priceNaira: { gte: rest.min_price, lte: rest.max_price },
      bedrooms: { gte: rest.min_bedrooms },
      floorAreaSqm: { gte: rest.min_area_sqft, lte: rest.max_area_sqft },
      is_furnished: rest.is_furnished,
      is_featured: rest.is_featured,
      amenities: rest.amenities ? { hasEvery: rest.amenities } : undefined,
      address: {
        city: rest.city
          ? { contains: rest.city, mode: "insensitive" }
          : undefined,
        state: rest.state
          ? { contains: rest.state, mode: "insensitive" }
          : undefined,
        zip_code: rest.zip_code,
      },
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    const orderByMap: any = {
      price_asc: { priceNaira: "asc" },
      price_desc: { priceNaira: "desc" },
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      area: { floorAreaSqm: "desc" },
    };

    const [data, total] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        orderBy: orderByMap[sort_by] || { createdAt: "desc" },
        skip,
        take: limit,
        include: { location: true },
      }),
      prisma.property.count({ where }),
    ]);

    const result: PaginatedResponse<any> = {
      success: true,
      data,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };

    await setCache(cacheKey, result, SEARCH_CACHE_TTL);
    return result;
  }

  private hashFilters(filters: PropertySearchFilters): string {
    const normalized = JSON.stringify(
      Object.entries(filters)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce<Record<string, unknown>>(
          (acc, [k, v]) => ({ ...acc, [k]: v }),
          {},
        ),
    );
    return crypto
      .createHash("sha256")
      .update(normalized)
      .digest("hex")
      .slice(0, 16);
  }
}

export const searchService = new SearchService();
