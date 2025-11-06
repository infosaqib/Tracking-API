/*
  Warnings:

  - You are about to drop the column `roleLevel` on the `Roles` table. All the data in the column will be lost.
  - Changed the type of `permissionsId` on the `RolePermissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "RolePermissions" DROP CONSTRAINT "RolePermissions_permissionsId_fkey";

-- AlterTable
ALTER TABLE "RolePermissions" DROP COLUMN "permissionsId",
ADD COLUMN     "permissionsId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Roles" DROP COLUMN "roleLevel",
ALTER COLUMN "deletedOn" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_rolesId_permissionsId_key" ON "RolePermissions"("rolesId", "permissionsId");
