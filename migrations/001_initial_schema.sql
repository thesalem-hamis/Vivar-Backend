-- ═══════════════════════════════════════════════════════════
-- migrations/001_initial_schema.sql
-- Initial schema for the real estate platform.
--
-- Run with: psql -U postgres -d real_estate_db -f migrations/001_initial_schema.sql
--
-- Extensions required: pgcrypto (UUIDs), postgis (geo queries)
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE user_role         AS ENUM ('buyer', 'seller', 'agent', 'admin');
CREATE TYPE property_type     AS ENUM ('house', 'apartment', 'condo', 'townhouse', 'land', 'commercial');
CREATE TYPE property_status   AS ENUM ('active', 'pending', 'sold', 'rented', 'withdrawn');
CREATE TYPE listing_type      AS ENUM ('sale', 'rent');
CREATE TYPE booking_status    AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20),
  role          user_role NOT NULL DEFAULT 'buyer',
  avatar_url    TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ─────────────────────────────────────────────
-- AGENTS (extends users with professional info)
-- ─────────────────────────────────────────────

CREATE TABLE agents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number   VARCHAR(100) UNIQUE NOT NULL,
  agency_name      VARCHAR(200),
  bio              TEXT,
  years_experience SMALLINT NOT NULL DEFAULT 0,
  rating           NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  total_reviews    INTEGER NOT NULL DEFAULT 0,
  total_listings   INTEGER NOT NULL DEFAULT 0,
  specializations  TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_rating  ON agents(rating DESC);

-- ─────────────────────────────────────────────
-- PROPERTIES
-- ─────────────────────────────────────────────

CREATE TABLE properties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         UUID NOT NULL REFERENCES agents(id),
  title            VARCHAR(200) NOT NULL,
  description      TEXT NOT NULL,
  type             property_type NOT NULL,
  status           property_status NOT NULL DEFAULT 'active',
  listing_type     listing_type NOT NULL,
  price            NUMERIC(12,2) NOT NULL,
  bedrooms         SMALLINT NOT NULL DEFAULT 0,
  bathrooms        NUMERIC(3,1) NOT NULL DEFAULT 0,
  area_sqft        NUMERIC(10,2) NOT NULL,
  lot_size_sqft    NUMERIC(10,2),
  year_built       SMALLINT,
  parking_spaces   SMALLINT NOT NULL DEFAULT 0,
  is_furnished     BOOLEAN NOT NULL DEFAULT FALSE,
  amenities        TEXT[] NOT NULL DEFAULT '{}',
  images           TEXT[] NOT NULL DEFAULT '{}',
  virtual_tour_url TEXT,
  -- PostGIS geography column for precise distance calculations
  location         GEOGRAPHY(POINT, 4326),
  views_count      INTEGER NOT NULL DEFAULT 0,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  -- Full-text search vector (auto-updated by trigger below)
  search_vector    TSVECTOR,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Geo index for radius searches
CREATE INDEX idx_properties_location    ON properties USING GIST(location);
-- Full-text index
CREATE INDEX idx_properties_search      ON properties USING GIN(search_vector);
-- Filter indexes
CREATE INDEX idx_properties_agent       ON properties(agent_id);
CREATE INDEX idx_properties_status      ON properties(status);
CREATE INDEX idx_properties_type        ON properties(type);
CREATE INDEX idx_properties_listing     ON properties(listing_type);
CREATE INDEX idx_properties_price       ON properties(price);
CREATE INDEX idx_properties_featured    ON properties(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_properties_amenities   ON properties USING GIN(amenities);

-- Auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_search_vector
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────
-- PROPERTY ADDRESSES (separated for normalization)
-- ─────────────────────────────────────────────

CREATE TABLE property_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  street      VARCHAR(255) NOT NULL,
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  zip_code    VARCHAR(20) NOT NULL,
  country     VARCHAR(100) NOT NULL DEFAULT 'US',
  UNIQUE(property_id)
);

CREATE INDEX idx_addresses_city     ON property_addresses(city);
CREATE INDEX idx_addresses_state    ON property_addresses(state);
CREATE INDEX idx_addresses_zip      ON property_addresses(zip_code);

-- ─────────────────────────────────────────────
-- BOOKINGS (property viewings / tours)
-- ─────────────────────────────────────────────

CREATE TABLE bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID NOT NULL REFERENCES properties(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  agent_id         UUID NOT NULL REFERENCES agents(id),
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT NOT NULL DEFAULT 30,
  status           booking_status NOT NULL DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_property   ON bookings(property_id);
CREATE INDEX idx_bookings_user       ON bookings(user_id);
CREATE INDEX idx_bookings_agent      ON bookings(agent_id);
CREATE INDEX idx_bookings_scheduled  ON bookings(scheduled_at);

-- ─────────────────────────────────────────────
-- REVIEWS (agents only; 1 review per user per agent)
-- ─────────────────────────────────────────────

CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, user_id)
);

CREATE INDEX idx_reviews_agent ON reviews(agent_id);

-- Auto-recalculate agent rating after review insert/update/delete
CREATE OR REPLACE FUNCTION refresh_agent_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE agents
  SET rating       = COALESCE((SELECT AVG(rating) FROM reviews WHERE agent_id = COALESCE(NEW.agent_id, OLD.agent_id)), 0),
      total_reviews = (SELECT COUNT(*) FROM reviews WHERE agent_id = COALESCE(NEW.agent_id, OLD.agent_id))
  WHERE id = COALESCE(NEW.agent_id, OLD.agent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_agent_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_agent_rating();

-- ─────────────────────────────────────────────
-- SAVED PROPERTIES (favourites / watchlist)
-- ─────────────────────────────────────────────

CREATE TABLE saved_properties (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);
