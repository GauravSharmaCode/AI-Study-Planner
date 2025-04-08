/*
  Warnings:

  - The values [COMPLETE] on the enum `ScheduleType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Schedule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dailySchedule` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `revision` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `targets` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `tests` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `weekNumber` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `weeklySchedule` on the `Schedule` table. All the data in the column will be lost.
  - The `id` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `dailyTargets` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Made the column `dayNumber` on table `Schedule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleType_new" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
ALTER TABLE "Schedule" ALTER COLUMN "type" TYPE "ScheduleType_new" USING ("type"::text::"ScheduleType_new");
ALTER TYPE "ScheduleType" RENAME TO "ScheduleType_old";
ALTER TYPE "ScheduleType_new" RENAME TO "ScheduleType";
DROP TYPE "ScheduleType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_userId_fkey";

-- AlterTable
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_pkey",
DROP COLUMN "dailySchedule",
DROP COLUMN "revision",
DROP COLUMN "targets",
DROP COLUMN "tests",
DROP COLUMN "weekNumber",
DROP COLUMN "weeklySchedule",
ADD COLUMN     "dailyTargets" JSONB NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "dayNumber" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'DAILY',
ADD CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
