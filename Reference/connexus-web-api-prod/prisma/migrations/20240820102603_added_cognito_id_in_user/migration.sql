/*
  Warnings:

  - A unique constraint covering the columns `[cognitoId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "cognitoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_cognitoId_key" ON "Users"("cognitoId");
