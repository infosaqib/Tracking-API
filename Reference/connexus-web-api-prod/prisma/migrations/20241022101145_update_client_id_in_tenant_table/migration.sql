-- This migration is to update the clientId in the Tenants table
UPDATE "Tenants" t
SET "clientId" = c.id
FROM "Client" c
WHERE t."id" = c."tenantId"
    AND t."clientId" IS NULL
    AND c."tenantId" IS NOT NULL;