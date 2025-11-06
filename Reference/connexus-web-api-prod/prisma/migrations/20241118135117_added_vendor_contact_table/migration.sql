-- CreateTable
CREATE TABLE "VendorContacts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "updaterId" TEXT NOT NULL,
    "userId" TEXT,
    "vendorId" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "VendorContacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorContacts_userId_vendorId_key" ON "VendorContacts"("userId", "vendorId");

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_updaterId_fkey" FOREIGN KEY ("updaterId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContacts" ADD CONSTRAINT "VendorContacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
