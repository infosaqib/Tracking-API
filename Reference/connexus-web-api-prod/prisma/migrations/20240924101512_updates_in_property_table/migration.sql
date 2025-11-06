-- AlterTable
ALTER TABLE "ClientProperties" ADD COLUMN     "acres" DOUBLE PRECISION,
ADD COLUMN     "legalName" VARCHAR(250),
ADD COLUMN     "zip" VARCHAR(8),
ALTER COLUMN "address" DROP NOT NULL;
