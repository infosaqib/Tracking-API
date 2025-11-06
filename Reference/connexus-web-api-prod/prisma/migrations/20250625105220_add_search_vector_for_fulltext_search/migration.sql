ALTER TABLE "Services"
ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("servicesName", '')), 'A') || ' ' ||
  setweight(to_tsvector('english', coalesce("serviceDescription", '')), 'B')
) STORED;

CREATE INDEX "services_search_idx" ON "Services" USING GIN ("search_vector");
