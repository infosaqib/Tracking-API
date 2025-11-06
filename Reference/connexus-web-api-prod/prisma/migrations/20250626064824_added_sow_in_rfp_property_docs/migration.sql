-- AlterTable
ALTER TABLE "RfpPropertyAttachments" ADD COLUMN     "scopeOfWorkId" TEXT;

-- AddForeignKey
ALTER TABLE "RfpPropertyAttachments" ADD CONSTRAINT "RfpPropertyAttachments_scopeOfWorkId_fkey" FOREIGN KEY ("scopeOfWorkId") REFERENCES "ScopeOfWork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
