-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'DATA_REQUEST_PUBLIC_SUBMITTED';

-- AlterEnum
ALTER TYPE "DataRequestStatus" ADD VALUE 'PENDING_COORDINATOR';

-- DropForeignKey
ALTER TABLE "DataRequestForm" DROP CONSTRAINT "DataRequestForm_createdByAdminId_fkey";

-- AlterTable
ALTER TABLE "DataRequestForm" ADD COLUMN     "submitterEmail" TEXT,
ADD COLUMN     "submitterName" TEXT,
ADD COLUMN     "submitterPhone" TEXT,
ALTER COLUMN "createdByAdminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DataRequestForm" ADD CONSTRAINT "DataRequestForm_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
