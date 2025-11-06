-- Remove duplicate cities
DELETE FROM public."Cities" c1 
WHERE c1.id IN (
    SELECT c2.id
    FROM public."Cities" c2
    INNER JOIN (
        SELECT "cityName", "stateId", MIN(id) as min_id
        FROM public."Cities"
        GROUP BY "cityName", "stateId"
        HAVING COUNT(*) > 1
    ) dups 
    ON c2."cityName" = dups."cityName" 
    AND c2."stateId" = dups."stateId"
    WHERE c2.id != dups.min_id
);


DELETE FROM public."County" c1 
WHERE c1.id IN (
    SELECT c2.id
    FROM public."County" c2
    INNER JOIN (
        SELECT "name", "stateId", MIN(id) as min_id
        FROM public."County"
        GROUP BY "name", "stateId"
        HAVING COUNT(*) > 1
    ) dups 
    ON c2."name" = dups."name" 
    AND c2."stateId" = dups."stateId"
    WHERE c2.id != dups.min_id
);