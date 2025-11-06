-- AlterTable
ALTER TABLE "Services" ADD COLUMN     "parentServiceId" TEXT;

-- AddForeignKey
ALTER TABLE "Services" ADD CONSTRAINT "Services_parentServiceId_fkey" FOREIGN KEY ("parentServiceId") REFERENCES "Services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Move SubServices to Services table as child services
-- Handle unique constraint conflicts by appending parent service name when needed
INSERT INTO "Services" (
    id,
    "servicesName",
    "serviceDescription",
    status,
    category,
    "deletedAt",
    "createdAt",
    "modifiedAt",
    "creatorId",
    "updaterId",
    "parentServiceId"
)
SELECT 
    ss.id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "Services" s 
            WHERE s."servicesName" = ss."subServiceName"
        ) THEN ss."subServiceName" || ' - ' || ps."servicesName"
        ELSE ss."subServiceName"
    END as "servicesName",
    ss."subServiceDescription" as "serviceDescription",
    ps.status as status,
    ps.category as category,
    NULL as "deletedAt",
    ss."createdAt",
    ss."modifiedAt",
    ss."creatorId",
    ss."updaterId",
    ss."servicesId" as "parentServiceId"
FROM "SubServices" ss
JOIN "Services" ps ON ss."servicesId" = ps.id;
