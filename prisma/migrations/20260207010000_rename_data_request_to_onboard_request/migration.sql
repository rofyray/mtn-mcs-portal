-- Rename enum DataRequestStatus -> OnboardRequestStatus
ALTER TYPE "DataRequestStatus" RENAME TO "OnboardRequestStatus";

-- Rename AuditAction enum values
ALTER TYPE "AuditAction" RENAME VALUE 'DATA_REQUEST_CREATED' TO 'ONBOARD_REQUEST_CREATED';
ALTER TYPE "AuditAction" RENAME VALUE 'DATA_REQUEST_SUBMITTED_TO_MANAGER' TO 'ONBOARD_REQUEST_SUBMITTED_TO_MANAGER';
ALTER TYPE "AuditAction" RENAME VALUE 'DATA_REQUEST_SUBMITTED_TO_SENIOR_MANAGER' TO 'ONBOARD_REQUEST_SUBMITTED_TO_SENIOR_MANAGER';
ALTER TYPE "AuditAction" RENAME VALUE 'DATA_REQUEST_SUBMITTED_TO_LEGAL' TO 'ONBOARD_REQUEST_SUBMITTED_TO_LEGAL';
ALTER TYPE "AuditAction" RENAME VALUE 'DATA_REQUEST_APPROVED' TO 'ONBOARD_REQUEST_APPROVED';
ALTER TYPE "AuditAction" RENAME VALUE 'DATA_REQUEST_DENIED' TO 'ONBOARD_REQUEST_DENIED';
ALTER TYPE "AuditAction" RENAME VALUE 'DATA_REQUEST_PUBLIC_SUBMITTED' TO 'ONBOARD_REQUEST_PUBLIC_SUBMITTED';

-- Rename tables
ALTER TABLE "DataRequestForm" RENAME TO "OnboardRequestForm";
ALTER TABLE "DataRequestApproval" RENAME TO "OnboardRequestApproval";

-- Rename FK column
ALTER TABLE "OnboardRequestApproval" RENAME COLUMN "dataRequestFormId" TO "onboardRequestFormId";

-- Rename indexes (Prisma convention: TableName_columnName_idx)
ALTER INDEX "DataRequestForm_status_idx" RENAME TO "OnboardRequestForm_status_idx";
ALTER INDEX "DataRequestForm_regionCode_idx" RENAME TO "OnboardRequestForm_regionCode_idx";
ALTER INDEX "DataRequestForm_createdByAdminId_idx" RENAME TO "OnboardRequestForm_createdByAdminId_idx";
ALTER INDEX "DataRequestApproval_dataRequestFormId_idx" RENAME TO "OnboardRequestApproval_onboardRequestFormId_idx";
ALTER INDEX "DataRequestApproval_adminId_idx" RENAME TO "OnboardRequestApproval_adminId_idx";
