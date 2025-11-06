/*
  Warnings:

  - The primary key for the `PropertyContacts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PropertyContacts` table. All the data in the column will be lost.
  - Added the required column `propertyId` to the `PropertyContacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `PropertyContacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PropertyContacts" DROP CONSTRAINT "PropertyContacts_pkey",
DROP COLUMN "id",
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "PropertyContacts_pkey" PRIMARY KEY ("propertyId", "userId");

-- AddForeignKey
ALTER TABLE "PropertyContacts" ADD CONSTRAINT "PropertyContacts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "ClientProperties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyContacts" ADD CONSTRAINT "PropertyContacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
