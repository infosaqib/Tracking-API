/*
  Warnings:

  - A unique constraint covering the columns `[servicesName]` on the table `Services` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subServiceName,servicesId]` on the table `SubServices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Services_servicesName_key" ON "Services"("servicesName");

-- CreateIndex
CREATE UNIQUE INDEX "SubServices_subServiceName_servicesId_key" ON "SubServices"("subServiceName", "servicesId");
