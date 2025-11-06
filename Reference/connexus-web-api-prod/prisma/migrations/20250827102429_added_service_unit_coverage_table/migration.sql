-- CreateEnum
CREATE TYPE "GeoScope" AS ENUM ('CITY', 'COUNTY', 'STATE');
-- CreateTable
CREATE TABLE "ServiceUnitCoverage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "geoScope" "GeoScope" NOT NULL,
    "geoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceUnitCoverage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceUnitCoverage" ADD CONSTRAINT "ServiceUnitCoverage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUnitCoverage" ADD CONSTRAINT "ServiceUnitCoverage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
