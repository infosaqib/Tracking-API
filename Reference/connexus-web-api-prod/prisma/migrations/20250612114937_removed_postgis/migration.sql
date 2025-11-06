/*
  Warnings:

  - You are about to drop the column `geom` on the `Cities` table. All the data in the column will be lost.
  - You are about to drop the column `geom` on the `Countries` table. All the data in the column will be lost.
  - You are about to drop the column `geom` on the `County` table. All the data in the column will be lost.
  - You are about to drop the column `geom` on the `States` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cities" DROP COLUMN "geom";

-- AlterTable
ALTER TABLE "Countries" DROP COLUMN "geom";

-- AlterTable
ALTER TABLE "County" DROP COLUMN "geom";

-- AlterTable
ALTER TABLE "States" DROP COLUMN "geom";
