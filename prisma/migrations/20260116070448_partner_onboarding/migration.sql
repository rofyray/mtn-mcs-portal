-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'DENIED', 'EXPIRED');

-- CreateTable
CREATE TABLE "PartnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "denialReason" TEXT,
    "businessName" TEXT,
    "partnerFirstName" TEXT,
    "partnerSurname" TEXT,
    "phoneNumber" TEXT,
    "paymentWallet" TEXT,
    "ghanaCardNumber" TEXT,
    "ghanaCardFrontUrl" TEXT,
    "ghanaCardBackUrl" TEXT,
    "passportPhotoUrl" TEXT,
    "taxIdentityNumber" TEXT,
    "addressRegionCode" TEXT,
    "addressDistrictCode" TEXT,
    "addressCode" TEXT,
    "gpsLatitude" TEXT,
    "gpsLongitude" TEXT,
    "city" TEXT,
    "landmark" TEXT,
    "businessCertificateUrl" TEXT,
    "businessCertificateId" TEXT,
    "fireCertificateUrl" TEXT,
    "fireCertificateId" TEXT,
    "insuranceUrl" TEXT,
    "insuranceId" TEXT,
    "storeFrontUrl" TEXT,
    "storeInsideUrl" TEXT,
    "apn" TEXT,
    "mifiImei" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProfile_userId_key" ON "PartnerProfile"("userId");

-- AddForeignKey
ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
