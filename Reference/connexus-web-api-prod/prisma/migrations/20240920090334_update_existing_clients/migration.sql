-- Update existing clients with tenantId
SELECT c.id,
    c.name,
    t.id as tenant_id
FROM "Client" c
    JOIN "Tenants" t ON t."clientId" = c.id
WHERE c."tenantId" IS NULL;