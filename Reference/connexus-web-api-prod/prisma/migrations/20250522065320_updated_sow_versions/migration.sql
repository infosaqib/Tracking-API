/*
  Warnings:

  - You are about to drop the column `fileName` on the `ScopeOfWork` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `ScopeOfWork` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `ScopeOfWorkVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceFileUrl` to the `ScopeOfWorkVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScopeOfWork" DROP COLUMN "fileName",
DROP COLUMN "fileUrl";

-- AlterTable
ALTER TABLE "ScopeOfWorkVersion" ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "modifiedById" TEXT,
ADD COLUMN     "sourceFileUrl" TEXT NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkVersion" ADD CONSTRAINT "ScopeOfWorkVersion_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
