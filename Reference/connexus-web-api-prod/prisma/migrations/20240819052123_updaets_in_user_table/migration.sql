-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "updaterId" TEXT,
ALTER COLUMN "lastInviteId" DROP NOT NULL,
ALTER COLUMN "lastInviteSendTime" DROP NOT NULL,
ALTER COLUMN "lastInviteSendTime" DROP DEFAULT;
