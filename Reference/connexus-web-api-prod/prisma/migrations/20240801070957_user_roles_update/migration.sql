/*
  Warnings:

  - The primary key for the `UserRoles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserRoles` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `UserRoles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `UserRoles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserRoles" DROP CONSTRAINT "UserRoles_pkey",
DROP COLUMN "id",
ADD COLUMN     "roleId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("userId", "roleId");

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
