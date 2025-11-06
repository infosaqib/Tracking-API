/*
  Warnings:

  - A unique constraint covering the columns `[name,tenantsId]` on the table `Roles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_tenantsId_key" ON "Roles"("name", "tenantsId");
