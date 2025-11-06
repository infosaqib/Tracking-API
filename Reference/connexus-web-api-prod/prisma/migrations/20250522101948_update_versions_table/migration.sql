-- AlterEnum
ALTER TYPE "BuildingClassification" ADD VALUE 'CLASS_D';

-- DropIndex
DROP INDEX "ScopeOfWorkVersion_scopeOfWorkId_versionNumber_key";

-- CreateTable
CREATE TABLE "ScopeOfWorkPropertyVersion" (
    "id" TEXT NOT NULL,
    "scopeOfWorkPropertyId" TEXT NOT NULL,
    "scopeOfWorkVersionId" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopeOfWorkPropertyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScopeOfWorkPropertyVersion_scopeOfWorkPropertyId_scopeOfWor_key" ON "ScopeOfWorkPropertyVersion"("scopeOfWorkPropertyId", "scopeOfWorkVersionId");

-- AddForeignKey
ALTER TABLE "ScopeOfWorkPropertyVersion" ADD CONSTRAINT "ScopeOfWorkPropertyVersion_scopeOfWorkPropertyId_fkey" FOREIGN KEY ("scopeOfWorkPropertyId") REFERENCES "ScopeOfWorkProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkPropertyVersion" ADD CONSTRAINT "ScopeOfWorkPropertyVersion_scopeOfWorkVersionId_fkey" FOREIGN KEY ("scopeOfWorkVersionId") REFERENCES "ScopeOfWorkVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
