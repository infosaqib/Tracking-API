/*
  Warnings:

  - You are about to alter the column `unitCount` on the `ClientProperties` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `buildingCount` on the `ClientProperties` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `floorCount` on the `ClientProperties` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "ClientProperties" ALTER COLUMN "unitCount" SET DATA TYPE INTEGER,
ALTER COLUMN "buildingCount" SET DATA TYPE INTEGER,
ALTER COLUMN "floorCount" SET DATA TYPE INTEGER;
