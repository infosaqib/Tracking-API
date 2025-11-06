-- AlterTable
ALTER TABLE "Services"
ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS
((setweight(to_tsvector('english'::regconfig, COALESCE("servicesName", ''::text)), 'A'::"char") || ''::tsvector) || setweight(to_tsvector('english'::regconfig, COALESCE("serviceDescription", ''::text)), 'B'::"char"))
STORED;

-- CreateIndex
CREATE INDEX "services_search_idx" ON "Services" USING GIN ("search_vector");
