/*
  Warnings:

  - A unique constraint covering the columns `[countryName]` on the table `Countries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stateName,countryId]` on the table `States` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Countries_countryName_key" ON "Countries"("countryName");

-- CreateIndex
CREATE UNIQUE INDEX "States_stateName_countryId_key" ON "States"("stateName", "countryId");
