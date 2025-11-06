/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Services` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "services_search_idx";

-- AlterTable
ALTER TABLE "Services" DROP COLUMN "search_vector";
