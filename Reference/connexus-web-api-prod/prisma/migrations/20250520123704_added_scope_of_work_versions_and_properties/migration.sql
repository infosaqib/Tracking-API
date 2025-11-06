-- AlterTable
ALTER TABLE "ScopeOfWork" ADD COLUMN     "sourceId" TEXT;

-- CreateTable
CREATE TABLE "ScopeOfWorkProperty" (
    "id" TEXT NOT NULL,
    "scopeOfWorkId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScopeOfWorkProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScopeOfWorkVersion" (
    "id" TEXT NOT NULL,
    "scopeOfWorkId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScopeOfWorkVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScopeOfWorkProperty_scopeOfWorkId_propertyId_key" ON "ScopeOfWorkProperty"("scopeOfWorkId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ScopeOfWorkVersion_scopeOfWorkId_versionNumber_key" ON "ScopeOfWorkVersion"("scopeOfWorkId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "unique_current_version" ON "ScopeOfWorkVersion"("scopeOfWorkId", "isCurrent");

-- AddForeignKey
ALTER TABLE "ScopeOfWork" ADD CONSTRAINT "ScopeOfWork_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ScopeOfWork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkProperty" ADD CONSTRAINT "ScopeOfWorkProperty_scopeOfWorkId_fkey" FOREIGN KEY ("scopeOfWorkId") REFERENCES "ScopeOfWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkProperty" ADD CONSTRAINT "ScopeOfWorkProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "ClientProperties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkVersion" ADD CONSTRAINT "ScopeOfWorkVersion_scopeOfWorkId_fkey" FOREIGN KEY ("scopeOfWorkId") REFERENCES "ScopeOfWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkVersion" ADD CONSTRAINT "ScopeOfWorkVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "ScopeOfWorkVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWorkVersion" ADD CONSTRAINT "ScopeOfWorkVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
