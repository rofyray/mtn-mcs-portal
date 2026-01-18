-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('SENT', 'SIGNED', 'REJECTED');

-- CreateTable
CREATE TABLE "FormRequest" (
    "id" TEXT NOT NULL,
    "partnerProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'SENT',
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSignature" (
    "id" TEXT NOT NULL,
    "formRequestId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureUrl" TEXT NOT NULL,

    CONSTRAINT "FormSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormSignature_formRequestId_key" ON "FormSignature"("formRequestId");

-- AddForeignKey
ALTER TABLE "FormRequest" ADD CONSTRAINT "FormRequest_partnerProfileId_fkey" FOREIGN KEY ("partnerProfileId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSignature" ADD CONSTRAINT "FormSignature_formRequestId_fkey" FOREIGN KEY ("formRequestId") REFERENCES "FormRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
