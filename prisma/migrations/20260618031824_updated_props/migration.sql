/*
  Warnings:

  - You are about to drop the column `agent_id` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `agent_id` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `amenities` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `is_featured` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `is_furnished` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `priceNaira` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `priceUsd` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `views_count` on the `Property` table. All the data in the column will be lost.
  - You are about to alter the column `floorAreaSqm` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the `Agent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyAddress` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `propertySubType` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyType` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Purpose" AS ENUM ('FOR_RENT', 'FOR_SALE', 'SHORT_LET', 'JOINT_VENTURE');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'FLAT_APARTMENT', 'COMMERCIAL', 'LAND', 'EVENT_CENTRE');

-- CreateEnum
CREATE TYPE "PropertySubType" AS ENUM ('DETACHED_DUPLEX', 'SEMI_DETACHED_DUPLEX', 'TERRACED_DUPLEX', 'BUNGALOW', 'MANSION', 'MINI_FLAT', 'SELF_CONTAIN', 'PENTHOUSE', 'MAISONETTE', 'STUDIO', 'OFFICE_SPACE', 'SHOP', 'WAREHOUSE', 'PLAZA', 'FILLING_STATION');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NGN', 'USD');

-- CreateEnum
CREATE TYPE "PaymentPeriod" AS ENUM ('PER_ANNUM', 'PER_MONTH', 'PER_NIGHT', 'OUTRIGHT');

-- CreateEnum
CREATE TYPE "LandTitle" AS ENUM ('C_OF_O', 'GOVERNORS_CONSENT', 'DEED_OF_ASSIGNMENT', 'EXCISION', 'GAZETTE', 'FAMILY_RECEIPT', 'FREEHOLD');

-- CreateEnum
CREATE TYPE "FurnishingStatus" AS ENUM ('FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('BRAND_NEW', 'NEWLY_BUILT', 'RENOVATED', 'FAIR_CONDITION');

-- CreateEnum
CREATE TYPE "PowerSupply" AS ENUM ('TWENTY_FOUR_HOURS', 'TWELVE_HOURS', 'SOLAR_INVERTER', 'PUBLIC_POWER_ONLY');

-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('WATER_TREATMENT_PLANT', 'SWIMMING_POOL', 'GATED_ESTATE', 'UNIFORMED_SECURITY', 'FITTED_KITCHEN', 'CCTV', 'AMPLE_PARKING');

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "PropertyAddress" DROP CONSTRAINT "PropertyAddress_project_id_fkey";

-- DropForeignKey
ALTER TABLE "PropertyAddress" DROP CONSTRAINT "PropertyAddress_property_id_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "agent_id";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "agent_id",
DROP COLUMN "amenities",
DROP COLUMN "is_active",
DROP COLUMN "is_featured",
DROP COLUMN "is_furnished",
DROP COLUMN "location",
DROP COLUMN "priceNaira",
DROP COLUMN "priceUsd",
DROP COLUMN "status",
DROP COLUMN "type",
DROP COLUMN "views_count",
ADD COLUMN     "condition" "Condition",
ADD COLUMN     "furnishingStatus" "FurnishingStatus",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "propertySubType" "PropertySubType" NOT NULL,
ADD COLUMN     "propertyType" "PropertyType" NOT NULL,
ADD COLUMN     "purpose" "Purpose" NOT NULL DEFAULT 'FOR_SALE',
ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "floorAreaSqm" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "description" DROP NOT NULL;

-- DropTable
DROP TABLE "Agent";

-- DropTable
DROP TABLE "PropertyAddress";

-- DropEnum
DROP TYPE "PropertyStatus";

-- CreateTable
CREATE TABLE "Amenities" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "isServiced" BOOLEAN NOT NULL DEFAULT false,
    "hasBq" BOOLEAN NOT NULL DEFAULT false,
    "powerSupply" "PowerSupply",
    "amenityList" "AmenityType"[],

    CONSTRAINT "Amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAndFees" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'NGN',
    "price" DECIMAL(15,2) NOT NULL,
    "paymentPeriod" "PaymentPeriod" NOT NULL,
    "serviceCharge" DECIMAL(12,2) DEFAULT 0,
    "agencyFeePercentage" DECIMAL(5,2) DEFAULT 0,
    "legalFeePercentage" DECIMAL(5,2) DEFAULT 0,
    "cautionFee" DECIMAL(12,2) DEFAULT 0,

    CONSTRAINT "PricingAndFees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "localityArea" TEXT NOT NULL,
    "estateName" TEXT,
    "streetAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAddress" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT,
    "country" TEXT NOT NULL,

    CONSTRAINT "ProjectAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Amenities_propertyId_key" ON "Amenities"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingAndFees_propertyId_key" ON "PricingAndFees"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_propertyId_key" ON "Location"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAddress_project_id_key" ON "ProjectAddress"("project_id");

-- AddForeignKey
ALTER TABLE "Amenities" ADD CONSTRAINT "Amenities_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingAndFees" ADD CONSTRAINT "PricingAndFees_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAddress" ADD CONSTRAINT "ProjectAddress_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
