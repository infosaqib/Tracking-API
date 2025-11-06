-- AlterTable
ALTER TABLE "TemplateGenerationTasks" ADD COLUMN     "rfpId" TEXT;

-- AddForeignKey
ALTER TABLE "TemplateGenerationTasks" ADD CONSTRAINT "TemplateGenerationTasks_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
