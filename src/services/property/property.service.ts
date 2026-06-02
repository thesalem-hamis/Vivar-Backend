import { db, withTransaction } from "../../config/database";
import { getCache, setCache, deleteCache } from "../../config/redis";
import {
  Property,
  PropertySearchFilters,
  PaginatedResponse,
} from "../../types";
import { AppError } from "../../utils/AppError";
import { logger } from "../../config/logger";

const CACHE_PREFIX = "cache:property";

export class PropertyService {
  async getById(id: string): Promise<Property> {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cached = await getCache<Property>(cacheKey);
    if (cached) return cached;

    const { rows } = await db.query<Property>(
      `SELECT p.*, 
              row_to_json(a) AS address,
              ST_AsGeoJSON(p.location)::jsonb AS location
       FROM properties p
       JOIN property_addresses a ON a.property_id = p.id
       WHERE p.id = $1 AND p.is_active = TRUE`,
      [id],
    );

    if (!rows[0]) throw new AppError("Property not found", 404);

    await setCache(cacheKey, rows[0]);
    return rows[0];
  }

  async create(agentId: string, data: Partial<Property>): Promise<Property> {
    return withTransaction(async (client) => {
      const { rows } = await client.query<Property>(
        `INSERT INTO properties
           (agent_id, title, description, type, listing_type, price,
            bedrooms, bathrooms, area_sqft, amenities, is_furnished,
            location, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                 ST_SetSRID(ST_MakePoint($12,$13),4326), 'active')
         RETURNING *`,
        [
          agentId,
          data.title,
          data.description,
          data.type,
          data.listing_type,
          data.price,
          data.bedrooms,
          data.bathrooms,
          data.area_sqft,
          data.amenities,
          data.is_furnished,
          data.location?.lng,
          data.location?.lat,
        ],
      );

      const property = rows[0];

      await client.query(
        `INSERT INTO property_addresses
           (property_id, street, city, state, zip_code, country)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          property.id,
          data.address?.street,
          data.address?.city,
          data.address?.state,
          data.address?.zip_code,
          data.address?.country,
        ],
      );

      await client.query(
        `UPDATE agents SET total_listings = total_listings + 1 WHERE id = $1`,
        [agentId],
      );

      logger.info("Property created", { propertyId: property.id, agentId });
      return property;
    });
  }

  async update(
    id: string,
    agentId: string,
    data: Partial<Property>,
  ): Promise<Property> {
    const { rows: ownerRows } = await db.query(
      `SELECT id FROM properties WHERE id = $1 AND agent_id = $2`,
      [id, agentId],
    );
    if (!ownerRows[0])
      throw new AppError("Property not found or access denied", 403);

    const { rows } = await db.query<Property>(
      `UPDATE properties
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           status = COALESCE($4, status),
           amenities = COALESCE($5, amenities),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        data.title,
        data.description,
        data.price,
        data.status,
        data.amenities,
        id,
      ],
    );

    await deleteCache(`${CACHE_PREFIX}:${id}`);
    return rows[0];
  }

  async delete(id: string, agentId: string): Promise<void> {
    const { rowCount } = await db.query(
      `UPDATE properties SET is_active = FALSE WHERE id = $1 AND agent_id = $2`,
      [id, agentId],
    );
    if (!rowCount)
      throw new AppError("Property not found or access denied", 403);

    await deleteCache(`${CACHE_PREFIX}:${id}`);
    logger.info("Property soft-deleted", { propertyId: id });
  }

  async incrementViews(id: string): Promise<void> {
    await db.query(
      `UPDATE properties SET views_count = views_count + 1 WHERE id = $1`,
      [id],
    );
  }

  async getFeatured(limit = 6): Promise<Property[]> {
    const cacheKey = "cache:properties:featured";
    const cached = await getCache<Property[]>(cacheKey);
    if (cached) return cached;

    const { rows } = await db.query<Property>(
      `SELECT p.*, row_to_json(a) AS address
       FROM properties p
       JOIN property_addresses a ON a.property_id = p.id
       WHERE p.is_featured = TRUE AND p.status = 'active' AND p.is_active = TRUE
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit],
    );

    await setCache(cacheKey, rows, 1800);
    return rows;
  }
}

export const propertyService = new PropertyService();
