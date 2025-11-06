-- CreateEnum
CREATE TYPE "RfpPortfolioType" AS ENUM ('MULTI_PROPERTY', 'SINGLE_PROPERTY');

-- CreateEnum
CREATE TYPE "RfpSendStatusTypes" AS ENUM ('DELIVERED', 'FAILED', 'OPENED', 'SENT');

-- CreateEnum
CREATE TYPE "RfpStatusType" AS ENUM ('AWARDED', 'CANCELLED', 'CLOSED', 'DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Rfps" (
    "id" TEXT NOT NULL,
    "rfpName" VARCHAR(255) NOT NULL,
    "clientId" TEXT NOT NULL,
    "rfpServiceId" TEXT NOT NULL,
    "status" "RfpStatusType" NOT NULL DEFAULT 'DRAFT',
    "portfolioType" "RfpPortfolioType" NOT NULL DEFAULT 'SINGLE_PROPERTY',
    "contractId" TEXT,
    "rfpDueDate" DATE,
    "rfpExtendedDueDate" DATE,
    "rfpAwardDate" DATE,
    "rfqDate" DATE,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "parentVersionId" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Rfps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpProperties" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "clientPropertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RfpProperties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpPropertyAttachments" (
    "id" TEXT NOT NULL,
    "rfpPropertyId" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" VARCHAR(100),
    "fileSizeBytes" BIGINT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RfpPropertyAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpDocuments" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" VARCHAR(100),
    "fileSizeBytes" BIGINT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RfpDocuments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpScopeOfWork" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "scopeOfWorkId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RfpScopeOfWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpSendLog" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "sendDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfpSendLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpSendRecipients" (
    "id" TEXT NOT NULL,
    "rfpSendLogId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "recipientEmail" VARCHAR(255) NOT NULL,
    "sendStatus" "RfpSendStatusTypes" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "RfpSendRecipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpDefinedServices" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RfpDefinedServices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RfpProperties_rfpId_clientPropertyId_deletedAt_key" ON "RfpProperties"("rfpId", "clientPropertyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RfpScopeOfWork_rfpId_scopeOfWorkId_deletedAt_key" ON "RfpScopeOfWork"("rfpId", "scopeOfWorkId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RfpSendRecipients_rfpSendLogId_vendorId_key" ON "RfpSendRecipients"("rfpSendLogId", "vendorId");

-- AddForeignKey
ALTER TABLE "Rfps" ADD CONSTRAINT "Rfps_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfps" ADD CONSTRAINT "Rfps_rfpServiceId_fkey" FOREIGN KEY ("rfpServiceId") REFERENCES "RfpDefinedServices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfps" ADD CONSTRAINT "Rfps_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfps" ADD CONSTRAINT "Rfps_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "Rfps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfps" ADD CONSTRAINT "Rfps_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfps" ADD CONSTRAINT "Rfps_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpProperties" ADD CONSTRAINT "RfpProperties_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpProperties" ADD CONSTRAINT "RfpProperties_clientPropertyId_fkey" FOREIGN KEY ("clientPropertyId") REFERENCES "ClientProperties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpProperties" ADD CONSTRAINT "RfpProperties_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpProperties" ADD CONSTRAINT "RfpProperties_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpPropertyAttachments" ADD CONSTRAINT "RfpPropertyAttachments_rfpPropertyId_fkey" FOREIGN KEY ("rfpPropertyId") REFERENCES "RfpProperties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpPropertyAttachments" ADD CONSTRAINT "RfpPropertyAttachments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpPropertyAttachments" ADD CONSTRAINT "RfpPropertyAttachments_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpDocuments" ADD CONSTRAINT "RfpDocuments_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpDocuments" ADD CONSTRAINT "RfpDocuments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpDocuments" ADD CONSTRAINT "RfpDocuments_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpScopeOfWork" ADD CONSTRAINT "RfpScopeOfWork_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpScopeOfWork" ADD CONSTRAINT "RfpScopeOfWork_scopeOfWorkId_fkey" FOREIGN KEY ("scopeOfWorkId") REFERENCES "ScopeOfWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpScopeOfWork" ADD CONSTRAINT "RfpScopeOfWork_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpScopeOfWork" ADD CONSTRAINT "RfpScopeOfWork_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpSendLog" ADD CONSTRAINT "RfpSendLog_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpSendLog" ADD CONSTRAINT "RfpSendLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpSendLog" ADD CONSTRAINT "RfpSendLog_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpSendRecipients" ADD CONSTRAINT "RfpSendRecipients_rfpSendLogId_fkey" FOREIGN KEY ("rfpSendLogId") REFERENCES "RfpSendLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpSendRecipients" ADD CONSTRAINT "RfpSendRecipients_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpSendRecipients" ADD CONSTRAINT "RfpSendRecipients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpSendRecipients" ADD CONSTRAINT "RfpSendRecipients_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpDefinedServices" ADD CONSTRAINT "RfpDefinedServices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpDefinedServices" ADD CONSTRAINT "RfpDefinedServices_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
