/*
  Warnings:

  - The `status` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[project_id]` on the table `PropertyAddress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('NEW', 'REVIEWED', 'CONTACTED', 'CONVERTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('COMING_SOON', 'SELLING_NOW', 'UNDER_CONSTRUCTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('FOR_SALE', 'FOR_RENT', 'SOLD');

-- DropForeignKey
ALTER TABLE "PropertyAddress" DROP CONSTRAINT "PropertyAddress_property_id_fkey";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "segment" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'SUBSCRIBED';

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "status",
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'FOR_SALE';

-- AlterTable
ALTER TABLE "PropertyAddress" ADD COLUMN     "project_id" TEXT,
ALTER COLUMN "property_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "developerName" TEXT,
    "description" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'COMING_SOON',
    "priceFrom" DECIMAL(65,30) NOT NULL,
    "unitCount" INTEGER,
    "bedroomRange" TEXT,
    "completionDate" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "landmark" TEXT,
    "isVetted" BOOLEAN NOT NULL DEFAULT true,
    "isLegallyVetted" BOOLEAN NOT NULL DEFAULT true,
    "agent_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "interestType" TEXT NOT NULL,
    "targetArea" TEXT NOT NULL,
    "budgetRange" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'NEW',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAddress_project_id_key" ON "PropertyAddress"("project_id");

-- AddForeignKey
ALTER TABLE "PropertyAddress" ADD CONSTRAINT "PropertyAddress_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAddress" ADD CONSTRAINT "PropertyAddress_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
