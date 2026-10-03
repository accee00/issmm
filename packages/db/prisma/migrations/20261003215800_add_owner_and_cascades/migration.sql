-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_userId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Board" DROP CONSTRAINT IF EXISTS "Board_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT IF EXISTS "Section_boardId_fkey";

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
