-- AlterTable
ALTER TABLE "OnboardRequestApproval" RENAME CONSTRAINT "DataRequestApproval_pkey" TO "OnboardRequestApproval_pkey";

-- AlterTable
ALTER TABLE "OnboardRequestForm" RENAME CONSTRAINT "DataRequestForm_pkey" TO "OnboardRequestForm_pkey";

-- RenameForeignKey
ALTER TABLE "OnboardRequestApproval" RENAME CONSTRAINT "DataRequestApproval_adminId_fkey" TO "OnboardRequestApproval_adminId_fkey";

-- RenameForeignKey
ALTER TABLE "OnboardRequestApproval" RENAME CONSTRAINT "DataRequestApproval_dataRequestFormId_fkey" TO "OnboardRequestApproval_onboardRequestFormId_fkey";

-- RenameForeignKey
ALTER TABLE "OnboardRequestForm" RENAME CONSTRAINT "DataRequestForm_createdByAdminId_fkey" TO "OnboardRequestForm_createdByAdminId_fkey";
