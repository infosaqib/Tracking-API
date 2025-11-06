/*
  Warnings:

  - The primary key for the `ClientNotApprovedVendor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ClientNotApprovedVendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ClientNotApprovedVendor" DROP CONSTRAINT "ClientNotApprovedVendor_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "ClientNotApprovedVendor_pkey" PRIMARY KEY ("clientId", "vendorId");