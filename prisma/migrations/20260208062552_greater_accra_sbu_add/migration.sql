-- AlterTable
ALTER TABLE "AdminRegionAssignment" ADD COLUMN     "sbuCode" TEXT;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "addressSbuCode" TEXT;

-- AlterTable
ALTER TABLE "OnboardRequestForm" ADD COLUMN     "sbuCode" TEXT;

-- CreateIndex
CREATE INDEX "Business_addressSbuCode_idx" ON "Business"("addressSbuCode");

-- CreateIndex
CREATE INDEX "OnboardRequestForm_sbuCode_idx" ON "OnboardRequestForm"("sbuCode");
