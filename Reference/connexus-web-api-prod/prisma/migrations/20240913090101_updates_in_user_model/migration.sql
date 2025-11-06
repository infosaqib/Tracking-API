/*
  Warnings:

  - You are about to drop the column `contactType` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserTenants" ADD COLUMN     "contactType" "ContactType";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "contactType";
