-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "ghanaCardFrontUrl" DROP NOT NULL,
ALTER COLUMN "ghanaCardBackUrl" DROP NOT NULL,
ALTER COLUMN "passportPhotoUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "storeFrontUrl" DROP NOT NULL,
ALTER COLUMN "storeInsideUrl" DROP NOT NULL;
