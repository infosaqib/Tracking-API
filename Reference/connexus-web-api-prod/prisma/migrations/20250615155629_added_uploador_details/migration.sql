-- AlterTable
ALTER TABLE "ScopeOfWorkVersion" ADD COLUMN     "uploadedAt" TIMESTAMP(3),
ADD COLUMN     "uploadedById" TEXT;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkVersion" ADD CONSTRAINT "ScopeOfWorkVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
