/*
  Warnings:

  - You are about to drop the column `isClientPrimaryContact` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `isClientSecondaryContact` on the `Users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('PRIMARY_CONTACT', 'SECONDARY_CONTACT', 'ON_SITE_TEAM_USER');

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "isClientPrimaryContact",
DROP COLUMN "isClientSecondaryContact",
ADD COLUMN     "contactType" "ContactType";
