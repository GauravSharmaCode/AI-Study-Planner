/*
  Warnings:

  - You are about to drop the column `evaluationMilestones` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyTargets` on the `Schedule` table. All the data in the column will be lost.
  - The `sessions` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `breaks` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Schedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_studyPlanId_fkey";

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "evaluationMilestones",
DROP COLUMN "monthlyTargets",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "sessions",
ADD COLUMN     "sessions" JSONB[],
DROP COLUMN "breaks",
ADD COLUMN     "breaks" JSONB[];

-- CreateIndex
CREATE INDEX "Schedule_studyPlanId_idx" ON "Schedule"("studyPlanId");

-- CreateIndex
CREATE INDEX "Schedule_userId_idx" ON "Schedule"("userId");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
