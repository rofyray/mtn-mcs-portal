-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'RESPONDED', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'RESTOCK_REQUEST_REPLIED';
ALTER TYPE "AuditAction" ADD VALUE 'RESTOCK_REQUEST_CLOSED';
ALTER TYPE "AuditAction" ADD VALUE 'TRAINING_REQUEST_REPLIED';
ALTER TYPE "AuditAction" ADD VALUE 'TRAINING_REQUEST_CLOSED';

-- AlterTable
ALTER TABLE "RestockRequest" ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "TrainingRequest" ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "RestockRequestReply" (
    "id" TEXT NOT NULL,
    "restockRequestId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderAdminId" TEXT,
    "senderPartnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestockRequestReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRequestReply" (
    "id" TEXT NOT NULL,
    "trainingRequestId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderAdminId" TEXT,
    "senderPartnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingRequestReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestockRequestReply_restockRequestId_idx" ON "RestockRequestReply"("restockRequestId");

-- CreateIndex
CREATE INDEX "TrainingRequestReply_trainingRequestId_idx" ON "TrainingRequestReply"("trainingRequestId");

-- AddForeignKey
ALTER TABLE "RestockRequestReply" ADD CONSTRAINT "RestockRequestReply_restockRequestId_fkey" FOREIGN KEY ("restockRequestId") REFERENCES "RestockRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRequestReply" ADD CONSTRAINT "TrainingRequestReply_trainingRequestId_fkey" FOREIGN KEY ("trainingRequestId") REFERENCES "TrainingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
