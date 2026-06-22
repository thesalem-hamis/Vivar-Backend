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

export interface CreatePropertyDTO {
  title: string;
  description?: string;
  propertyType: PropertyType;
  propertySubType: PropertySubType;
  purpose: Purpose;
  bedrooms?: number;
  bathrooms?: number;
  floorAreaSqm?: number;
  furnishingStatus?: FurnishingStatus;
  condition?: Condition;
  isActive?: boolean;

  location: {
    state: string;
    lga: string;
    localityArea: string;
    estateName?: string;
    streetAddress?: string;
    latitude?: number;
    longitude?: number;
  };
  pricing: {
    currency?: Currency;
    price: number;
    paymentPeriod: PaymentPeriod;
    serviceCharge?: number;
    agencyFeePercentage?: number;
    legalFeePercentage?: number;
    cautionFee?: number;
  };
  amenities: {
    isServiced?: boolean;
    hasBq?: boolean;
    powerSupply?: PowerSupply;
    amenityList?: AmenityType[];
  };
}

export interface PropertySearchFilters {
  searchQuery?: string;
  purpose?: Purpose;
  propertyType?: PropertyType;
  propertySubType?: PropertySubType;
  bedrooms?: number;

  state?: string;
  localityArea?: string;

  minPrice?: number;
  maxPrice?: number;

  isServiced?: boolean | string;
  hasBq?: boolean | string;

  page?: number;
  limit?: number;
}
