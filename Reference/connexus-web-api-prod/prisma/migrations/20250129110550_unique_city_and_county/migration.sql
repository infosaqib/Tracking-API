/*
  Warnings:

  - A unique constraint covering the columns `[cityName,stateId]` on the table `Cities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,stateId]` on the table `County` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Cities_cityName_stateId_key" ON "Cities"("cityName", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "County_name_stateId_key" ON "County"("name", "stateId");
