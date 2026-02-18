-- CreateTable
CREATE TABLE "PaySlip" (
    "id" TEXT NOT NULL,
    "partnerProfileId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "displayFilename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaySlip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaySlip_partnerProfileId_idx" ON "PaySlip"("partnerProfileId");

-- CreateIndex
CREATE INDEX "PaySlip_createdAt_idx" ON "PaySlip"("createdAt");

-- AddForeignKey
ALTER TABLE "PaySlip" ADD CONSTRAINT "PaySlip_partnerProfileId_fkey" FOREIGN KEY ("partnerProfileId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
