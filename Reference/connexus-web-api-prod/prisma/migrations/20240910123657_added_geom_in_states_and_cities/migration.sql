-- AlterTable
ALTER TABLE "Cities" ADD COLUMN     "geom" geometry(Point, 4326);

-- AlterTable
ALTER TABLE "States" ADD COLUMN     "geom" geometry(MultiPolygon, 4326);
