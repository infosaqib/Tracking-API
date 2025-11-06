
-- CreateIndex
CREATE INDEX "VendorServicableAreas_stateId_cityId_idx" ON "VendorServicableAreas"("stateId", "cityId");

-- CreateIndex
CREATE INDEX "VendorServicableAreas_stateId_countyId_idx" ON "VendorServicableAreas"("stateId", "countyId");

-- CreateIndex
CREATE INDEX "VendorServicableAreas_vendorId_stateId_idx" ON "VendorServicableAreas"("vendorId", "stateId");

-- CreateIndex
CREATE INDEX "VendorServicableAreas_countryId_stateId_idx" ON "VendorServicableAreas"("countryId", "stateId");

-- CreateIndex
CREATE INDEX "VendorServices_serviceId_vendorServiceType_vendorId_idx" ON "VendorServices"("serviceId", "vendorServiceType", "vendorId");

-- CreateIndex
CREATE INDEX "Vendors_tenantId_status_idx" ON "Vendors"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Vendors_stateId_status_idx" ON "Vendors"("stateId", "status");

-- CreateIndex
CREATE INDEX "Vendors_vendorServiceCoverContinentalUs_idx" ON "Vendors"("vendorServiceCoverContinentalUs");

-- CreateIndex
CREATE INDEX "Vendors_vendorInterestedReceiveRfpOutside_idx" ON "Vendors"("vendorInterestedReceiveRfpOutside");
