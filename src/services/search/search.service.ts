import crypto from "crypto";
import { db } from "../../config/database";
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
  ): Promise<PaginatedResponse<Property>> {
    const cacheKey = `cache:search:${this.hashFilters(filters)}`;
    const cached = await getCache<PaginatedResponse<Property>>(cacheKey);
    if (cached) return cached;

    const {
      page = 1,
      limit = 20,
      sort_by = "newest",
      lat,
      lng,
      radius_km,
      query,
      ...rest
    } = filters;

    const offset = (page - 1) * limit;
    const params: unknown[] = [];
    const conditions: string[] = ["p.status = 'active'", "p.is_active = TRUE"];

    const addParam = (val: unknown): string => {
      params.push(val);
      return `$${params.length}`;
    };

    if (query) {
      conditions.push(
        `to_tsvector('english', p.title || ' ' || p.description) @@ plainto_tsquery('english', ${addParam(query)})`,
      );
    }

    if (rest.type) conditions.push(`p.type = ${addParam(rest.type)}`);
    if (rest.listing_type)
      conditions.push(`p.listing_type = ${addParam(rest.listing_type)}`);
    if (rest.min_price)
      conditions.push(`p.price >= ${addParam(rest.min_price)}`);
    if (rest.max_price)
      conditions.push(`p.price <= ${addParam(rest.max_price)}`);
    if (rest.min_bedrooms)
      conditions.push(`p.bedrooms >= ${addParam(rest.min_bedrooms)}`);
    if (rest.min_area_sqft)
      conditions.push(`p.area_sqft >= ${addParam(rest.min_area_sqft)}`);
    if (rest.max_area_sqft)
      conditions.push(`p.area_sqft <= ${addParam(rest.max_area_sqft)}`);
    if (rest.is_furnished !== undefined)
      conditions.push(`p.is_furnished = ${addParam(rest.is_furnished)}`);
    if (rest.is_featured !== undefined)
      conditions.push(`p.is_featured = ${addParam(rest.is_featured)}`);

    if (rest.city)
      conditions.push(`a.city ILIKE ${addParam(`%${rest.city}%`)}`);
    if (rest.state)
      conditions.push(`a.state ILIKE ${addParam(`%${rest.state}%`)}`);
    if (rest.zip_code)
      conditions.push(`a.zip_code = ${addParam(rest.zip_code)}`);

    if (lat !== undefined && lng !== undefined && radius_km) {
      conditions.push(
        `ST_DWithin(
           p.location::geography,
           ST_SetSRID(ST_MakePoint(${addParam(lng)}, ${addParam(lat)}), 4326)::geography,
           ${addParam(radius_km * 1000)}
         )`,
      );
    }

    if (rest.amenities?.length) {
      conditions.push(`p.amenities && ${addParam(rest.amenities)}`);
    }

    const orderMap: Record<string, string> = {
      price_asc: "p.price ASC",
      price_desc: "p.price DESC",
      newest: "p.created_at DESC",
      oldest: "p.created_at ASC",
      area: "p.area_sqft DESC",
    };
    const orderBy = orderMap[sort_by] ?? "p.created_at DESC";

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [dataResult, countResult] = await Promise.all([
      db.query<Property>(
        `SELECT p.*, row_to_json(a) AS address,
                ST_AsGeoJSON(p.location)::jsonb AS location
         FROM properties p
         JOIN property_addresses a ON a.property_id = p.id
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ${addParam(limit)} OFFSET ${addParam(offset)}`,
        params,
      ),
      db.query<{ count: string }>(
        `SELECT COUNT(*) FROM properties p
         JOIN property_addresses a ON a.property_id = p.id
         ${whereClause}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const result: PaginatedResponse<Property> = {
      success: true,
      data: dataResult.rows,
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
