-- CreateEnum
CREATE TYPE "DataRequestStatus" AS ENUM ('DRAFT', 'PENDING_MANAGER', 'PENDING_SENIOR_MANAGER', 'PENDING_LEGAL', 'APPROVED', 'DENIED');

-- AlterEnum
ALTER TYPE "AdminRole" ADD VALUE 'LEGAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'DATA_REQUEST_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'DATA_REQUEST_SUBMITTED_TO_MANAGER';
ALTER TYPE "AuditAction" ADD VALUE 'DATA_REQUEST_SUBMITTED_TO_SENIOR_MANAGER';
ALTER TYPE "AuditAction" ADD VALUE 'DATA_REQUEST_SUBMITTED_TO_LEGAL';
ALTER TYPE "AuditAction" ADD VALUE 'DATA_REQUEST_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'DATA_REQUEST_DENIED';

-- CreateTable
CREATE TABLE "DataRequestForm" (
    "id" TEXT NOT NULL,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByAdminId" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "dateOfIncorporation" TIMESTAMP(3),
    "businessType" TEXT,
    "businessTypeOther" TEXT,
    "registeredNature" TEXT,
    "registrationCertNo" TEXT,
    "mainOfficeLocation" TEXT,
    "tinNumber" TEXT,
    "postalAddress" TEXT,
    "physicalAddress" TEXT,
    "companyPhone" TEXT,
    "digitalPostAddress" TEXT,
    "authorizedSignatory" JSONB,
    "contactPerson" JSONB,
    "pepDeclaration" JSONB,
    "imageUrls" TEXT[],
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRequestForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRequestApproval" (
    "id" TEXT NOT NULL,
    "dataRequestFormId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "signatureUrl" TEXT,
    "signatureDate" TIMESTAMP(3),
    "legalScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataRequestForm_status_idx" ON "DataRequestForm"("status");

-- CreateIndex
CREATE INDEX "DataRequestForm_regionCode_idx" ON "DataRequestForm"("regionCode");

-- CreateIndex
CREATE INDEX "DataRequestForm_createdByAdminId_idx" ON "DataRequestForm"("createdByAdminId");

-- CreateIndex
CREATE INDEX "DataRequestApproval_dataRequestFormId_idx" ON "DataRequestApproval"("dataRequestFormId");

-- CreateIndex
CREATE INDEX "DataRequestApproval_adminId_idx" ON "DataRequestApproval"("adminId");

-- AddForeignKey
ALTER TABLE "DataRequestForm" ADD CONSTRAINT "DataRequestForm_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRequestApproval" ADD CONSTRAINT "DataRequestApproval_dataRequestFormId_fkey" FOREIGN KEY ("dataRequestFormId") REFERENCES "DataRequestForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRequestApproval" ADD CONSTRAINT "DataRequestApproval_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
