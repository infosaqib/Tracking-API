/*
  Warnings:

  - You are about to drop the column `legalName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `legalName` on the `ClientProperties` table. All the data in the column will be lost.
  - Added the required column `name` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "legalName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ClientProperties" DROP COLUMN "legalName";
