/*
  Warnings:

  - The primary key for the `StudyPlan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `StudyPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudySession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `StudyPlan` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('DAILY', 'WEEKLY', 'COMPLETE');

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_studySessionId_fkey";

-- DropForeignKey
ALTER TABLE "StudyPlan" DROP CONSTRAINT "StudyPlan_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_studyPlanId_fkey";

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "StudyPlan" DROP CONSTRAINT "StudyPlan_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "numberOfAttempts" SET DEFAULT 1,
ADD CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleId",
DROP COLUMN "password",
ALTER COLUMN "name" SET NOT NULL;

-- DropTable
DROP TABLE "Resource";

-- DropTable
DROP TABLE "StudySession";

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "studyPlanId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "weekNumber" INTEGER,
    "dayNumber" INTEGER,
    "focus" TEXT NOT NULL,
    "targets" TEXT[],
    "tests" TEXT[],
    "sessions" JSONB,
    "breaks" JSONB,
    "revision" JSONB,
    "dailySchedule" JSONB,
    "weeklySchedule" JSONB,
    "monthlyTargets" TEXT[],
    "evaluationMilestones" TEXT[],
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add indexes for better query performance
CREATE INDEX "Schedule_studyPlanId_idx" ON "Schedule"("studyPlanId");
CREATE INDEX "Schedule_userId_idx" ON "Schedule"("userId");
CREATE INDEX "Schedule_type_idx" ON "Schedule"("type");
