-- CreateEnum
CREATE TYPE "MatchDecisionType" AS ENUM ('CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH_CONFIRMED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'CLAIM_INFO_REQUESTED', 'HANDOVER_READY');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'HANDOVER_COMPLETED';

-- AlterEnum
ALTER TYPE "ClaimStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "handoverConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "handoverConfirmedById" UUID,
ADD COLUMN     "handoverVerifiedIdentity" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ItemReport" ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "MatchDecision" (
    "id" UUID NOT NULL,
    "decision" "MatchDecisionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lostReportId" UUID NOT NULL,
    "foundReportId" UUID NOT NULL,
    "decidedById" UUID NOT NULL,

    CONSTRAINT "MatchDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "reportId" UUID,
    "claimId" UUID,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchDecision_lostReportId_idx" ON "MatchDecision"("lostReportId");

-- CreateIndex
CREATE INDEX "MatchDecision_foundReportId_idx" ON "MatchDecision"("foundReportId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDecision_lostReportId_foundReportId_key" ON "MatchDecision"("lostReportId", "foundReportId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_claimId_idx" ON "Notification"("claimId");

-- AddForeignKey
ALTER TABLE "MatchDecision" ADD CONSTRAINT "MatchDecision_lostReportId_fkey" FOREIGN KEY ("lostReportId") REFERENCES "ItemReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDecision" ADD CONSTRAINT "MatchDecision_foundReportId_fkey" FOREIGN KEY ("foundReportId") REFERENCES "ItemReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDecision" ADD CONSTRAINT "MatchDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_handoverConfirmedById_fkey" FOREIGN KEY ("handoverConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ItemReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
