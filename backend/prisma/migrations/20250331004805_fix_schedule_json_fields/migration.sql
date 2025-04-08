/*
  Warnings:

  - Changed the type of `type` on the `Schedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sessions` on the `Schedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `breaks` on the `Schedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "type",
ADD COLUMN     "type" "ScheduleType" NOT NULL,
DROP COLUMN "sessions",
ADD COLUMN     "sessions" JSONB NOT NULL,
DROP COLUMN "breaks",
ADD COLUMN     "breaks" JSONB NOT NULL;
