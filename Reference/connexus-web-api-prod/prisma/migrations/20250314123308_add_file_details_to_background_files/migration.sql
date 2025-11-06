-- AlterTable
ALTER TABLE "BackgroundJobs" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "fileId" TEXT;

-- CreateTable
CREATE TABLE "FileDetails" (
    "id" TEXT NOT NULL,
    "filePath" TEXT,
    "fileHash" TEXT,
    "fileName" TEXT,

    CONSTRAINT "FileDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileDetails_fileHash_idx" ON "FileDetails"("fileHash");

-- AddForeignKey
ALTER TABLE "BackgroundJobs" ADD CONSTRAINT "BackgroundJobs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE;
