-- CreateEnum
CREATE TYPE "SowThemeTypes" AS ENUM ('DEFAULT', 'CLIENT_THEME');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "themeHeaderImageUrl" TEXT;

-- AlterTable
ALTER TABLE "ScopeOfWork" ADD COLUMN     "themeType" "SowThemeTypes" NOT NULL DEFAULT 'DEFAULT';

