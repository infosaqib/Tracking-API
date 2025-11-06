-- AlterEnum
ALTER TYPE "public"."VendorRegistrationType" ADD VALUE 'CLIENT_ONBOARDED';

-- AlterTable
ALTER TABLE "public"."Vendors" ADD COLUMN     "createdByClientId" TEXT;

-- CreateTable
CREATE TABLE "public"."ClientNotApprovedVendor" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "modifiedById" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ClientNotApprovedVendor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Vendors" ADD CONSTRAINT "Vendors_createdByClientId_fkey" FOREIGN KEY ("createdByClientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientNotApprovedVendor" ADD CONSTRAINT "ClientNotApprovedVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientNotApprovedVendor" ADD CONSTRAINT "ClientNotApprovedVendor_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientNotApprovedVendor" ADD CONSTRAINT "ClientNotApprovedVendor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientNotApprovedVendor" ADD CONSTRAINT "ClientNotApprovedVendor_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
