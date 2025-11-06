/*
  Warnings:

  - You are about to drop the column `parentServiceMapId` on the `PropertyServiceMap` table. All the data in the column will be lost.
  - You are about to drop the `SubServices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PropertyServiceMap" DROP CONSTRAINT "PropertyServiceMap_parentServiceMapId_fkey";

-- DropForeignKey
ALTER TABLE "SubServices" DROP CONSTRAINT "SubServices_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "SubServices" DROP CONSTRAINT "SubServices_servicesId_fkey";

-- DropForeignKey
ALTER TABLE "SubServices" DROP CONSTRAINT "SubServices_updaterId_fkey";

-- AlterTable
ALTER TABLE "PropertyServiceMap" DROP COLUMN "parentServiceMapId";

-- DropTable
DROP TABLE "SubServices";
