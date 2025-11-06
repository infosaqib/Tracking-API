-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_updaterId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Vendors" DROP CONSTRAINT "Vendors_updaterId_fkey";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "updaterId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vendors" ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "updaterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendors" ADD CONSTRAINT "Vendors_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
