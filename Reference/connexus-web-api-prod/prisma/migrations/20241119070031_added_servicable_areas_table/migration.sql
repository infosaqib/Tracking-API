-- CreateTable
CREATE TABLE "VendorServicableAreas" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "cityId" TEXT,
    "countyId" TEXT,
    "createdById" TEXT NOT NULL,
    "modifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorServicableAreas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorServicableAreas_vendorId_stateId_cityId_key" ON "VendorServicableAreas"("vendorId", "stateId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorServicableAreas_vendorId_stateId_countyId_key" ON "VendorServicableAreas"("vendorId", "stateId", "countyId");

-- AddForeignKey
ALTER TABLE "VendorServicableAreas" ADD CONSTRAINT "VendorServicableAreas_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServicableAreas" ADD CONSTRAINT "VendorServicableAreas_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServicableAreas" ADD CONSTRAINT "VendorServicableAreas_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServicableAreas" ADD CONSTRAINT "VendorServicableAreas_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServicableAreas" ADD CONSTRAINT "VendorServicableAreas_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServicableAreas" ADD CONSTRAINT "VendorServicableAreas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServicableAreas" ADD CONSTRAINT "VendorServicableAreas_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
