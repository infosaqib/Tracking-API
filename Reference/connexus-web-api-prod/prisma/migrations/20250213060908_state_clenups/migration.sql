-- Remove states that are not referenced by any cities or counties
UPDATE "States" s
SET "isDeleted" = true
WHERE NOT EXISTS (
    SELECT 1 FROM "Cities" c WHERE c."stateId" = s.id
)
AND NOT EXISTS (
    SELECT 1 FROM "County" co WHERE co."stateId" = s.id
)
AND s."isDeleted" = false;