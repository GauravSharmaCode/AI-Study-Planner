-- DropIndex
DROP INDEX "Schedule_studyPlanId_idx";

-- DropIndex
DROP INDEX "Schedule_type_idx";

-- DropIndex
DROP INDEX "Schedule_userId_idx";

-- AlterTable
ALTER TABLE "StudyPlan" ALTER COLUMN "updatedAt" DROP DEFAULT;
