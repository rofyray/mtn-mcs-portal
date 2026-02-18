-- AlterTable: Add columns to Business
ALTER TABLE "Business" ADD COLUMN "fireCertificateUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN "insuranceUrl" TEXT;

-- Copy existing partner-level URLs to all their businesses
UPDATE "Business" b
SET "fireCertificateUrl" = pp."fireCertificateUrl",
    "insuranceUrl" = pp."insuranceUrl"
FROM "PartnerProfile" pp
WHERE b."partnerProfileId" = pp."id"
  AND (pp."fireCertificateUrl" IS NOT NULL OR pp."insuranceUrl" IS NOT NULL);

-- AlterTable: Remove columns from PartnerProfile
ALTER TABLE "PartnerProfile" DROP COLUMN "fireCertificateUrl";
ALTER TABLE "PartnerProfile" DROP COLUMN "insuranceUrl";
