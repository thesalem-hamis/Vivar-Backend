export enum UserRole {
  BUYER = "buyer",
  SELLER = "seller",
  AGENT = "agent",
  ADMIN = "admin",
}

export enum PropertyType {
  HOUSE = "house",
  APARTMENT = "apartment",
  CONDO = "condo",
  TOWNHOUSE = "townhouse",
  LAND = "land",
  COMMERCIAL = "commercial",
}

export enum PropertyStatus {
  ACTIVE = "active",
  PENDING = "pending",
  SOLD = "sold",
  RENTED = "rented",
  WITHDRAWN = "withdrawn",
}

export enum ListingType {
  SALE = "sale",
  RENT = "rent",
}

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface Agent {
  id: string;
  user_id: string;
  license_number: string;
  agency_name?: string;
  bio?: string;
  years_experience: number;
  rating: number;
  total_reviews: number;
  total_listings: number;
  specializations: string[];
  created_at: Date;
}

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  listing_type: ListingType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  lot_size_sqft?: number;
  year_built?: number;
  parking_spaces: number;
  is_furnished: boolean;
  amenities: string[];
  images: string[];
  virtual_tour_url?: string;
  address: PropertyAddress;
  location: GeoPoint;
  views_count: number;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PropertySearchFilters {
  query?: string;
  type?: PropertyType;
  listing_type?: ListingType;
  status?: PropertyStatus;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  min_area_sqft?: number;
  max_area_sqft?: number;
  city?: string;
  state?: string;
  zip_code?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  amenities?: string[];
  is_furnished?: boolean;
  is_featured?: boolean;
  sort_by?: "price_asc" | "price_desc" | "newest" | "oldest" | "area";
  page?: number;
  limit?: number;
}

export interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  agent_id: string;
  scheduled_at: Date;
  duration_minutes: number;
  status: BookingStatus;
  notes?: string;
  created_at: Date;
}

export interface Review {
  id: string;
  agent_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
