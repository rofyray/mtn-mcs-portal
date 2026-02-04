/*
  Warnings:

  - You are about to drop the column `addressCode` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `addressDistrictCode` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `addressRegionCode` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `addressCode` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `addressDistrictCode` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `addressRegionCode` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `gpsLatitude` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `gpsLongitude` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `landmark` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `storeFrontUrl` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `storeInsideUrl` on the `PartnerProfile` table. All the data in the column will be lost.
  - Added the required column `businessId` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `RestockRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "addressCode",
DROP COLUMN "addressDistrictCode",
DROP COLUMN "addressRegionCode",
DROP COLUMN "city",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PartnerProfile" DROP COLUMN "addressCode",
DROP COLUMN "addressDistrictCode",
DROP COLUMN "addressRegionCode",
DROP COLUMN "city",
DROP COLUMN "gpsLatitude",
DROP COLUMN "gpsLongitude",
DROP COLUMN "landmark",
DROP COLUMN "storeFrontUrl",
DROP COLUMN "storeInsideUrl";

-- AlterTable
ALTER TABLE "RestockRequest" ADD COLUMN     "businessId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestockRequest" ADD CONSTRAINT "RestockRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
