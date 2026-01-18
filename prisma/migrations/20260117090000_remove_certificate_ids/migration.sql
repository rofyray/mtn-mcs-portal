-- Remove deprecated certificate ID fields from partner profiles.
ALTER TABLE "PartnerProfile"
  DROP COLUMN "businessCertificateId",
  DROP COLUMN "fireCertificateId",
  DROP COLUMN "insuranceId";
