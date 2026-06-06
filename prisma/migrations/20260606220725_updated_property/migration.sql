-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_furnished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "views_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateTable
CREATE TABLE "PropertyAddress" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT,
    "country" TEXT NOT NULL,

    CONSTRAINT "PropertyAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAddress_property_id_key" ON "PropertyAddress"("property_id");

-- AddForeignKey
ALTER TABLE "PropertyAddress" ADD CONSTRAINT "PropertyAddress_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
