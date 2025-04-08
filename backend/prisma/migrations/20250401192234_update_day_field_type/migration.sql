/*
  Warnings:

  - Added the required column `updatedAt` to the `Resource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StudySession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_studySessionId_fkey";

-- DropForeignKey
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_studyPlanId_fkey";

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StudySession" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Resource_studySessionId_idx" ON "Resource"("studySessionId");

-- CreateIndex
CREATE INDEX "StudySession_studyPlanId_idx" ON "StudySession"("studyPlanId");

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_studySessionId_fkey" FOREIGN KEY ("studySessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
