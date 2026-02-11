/*
  Warnings:

  - You are about to drop the column `ghanaCardBackUrl` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `ghanaCardFrontUrl` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `apn` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `ghanaCardBackUrl` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `ghanaCardFrontUrl` on the `PartnerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `mifiImei` on the `PartnerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "ghanaCardBackUrl",
DROP COLUMN "ghanaCardFrontUrl";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "apn" TEXT,
ADD COLUMN     "mifiImei" TEXT;

-- AlterTable
ALTER TABLE "PartnerProfile" DROP COLUMN "apn",
DROP COLUMN "ghanaCardBackUrl",
DROP COLUMN "ghanaCardFrontUrl",
DROP COLUMN "mifiImei",
ADD COLUMN     "regionCode" TEXT,
ADD COLUMN     "sbuCode" TEXT;
