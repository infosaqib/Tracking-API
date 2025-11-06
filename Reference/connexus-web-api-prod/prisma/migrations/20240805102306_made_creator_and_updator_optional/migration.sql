/*
  Warnings:

  - You are about to drop the column `usersId` on the `RolePermissions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RolePermissions" DROP CONSTRAINT "RolePermissions_updaterId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermissions" DROP CONSTRAINT "RolePermissions_usersId_fkey";

-- DropForeignKey
ALTER TABLE "Roles" DROP CONSTRAINT "Roles_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Roles" DROP CONSTRAINT "Roles_updaterId_fkey";

-- AlterTable
ALTER TABLE "RolePermissions" DROP COLUMN "usersId",
ADD COLUMN     "creatorId" TEXT,
ALTER COLUMN "updaterId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Roles" ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "updaterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Roles" ADD CONSTRAINT "Roles_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roles" ADD CONSTRAINT "Roles_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
