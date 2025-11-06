/*
  Warnings:

  - A unique constraint covering the columns `[userId,propertyId]` on the table `PropertyContacts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PropertyContacts_userId_propertyId_key" ON "PropertyContacts"("userId", "propertyId");
