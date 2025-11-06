/*
  Warnings:

  - You are about to drop the column `authrised` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `postition` on the `Users` table. All the data in the column will be lost.
  - Added the required column `position` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "authrised",
DROP COLUMN "postition",
ADD COLUMN     "authorized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position" VARCHAR(50) NOT NULL,
ALTER COLUMN "avatarUrl" DROP NOT NULL;
