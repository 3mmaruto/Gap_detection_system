/*
  Warnings:

  - The primary key for the `teacher_subjects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[day,period]` on the table `schedule_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `day` to the `schedule_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `schedule_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level_id` to the `teacher_subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `topics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "part_grades" ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "schedule_items" ADD COLUMN     "day" TEXT NOT NULL,
ADD COLUMN     "period" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "teacher_subjects" DROP CONSTRAINT "teacher_subjects_pkey",
ADD COLUMN     "level_id" INTEGER NOT NULL,
ADD CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("teacher_id", "subject_id", "level_id");

-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "name_ar" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "schedule_items_day_period_key" ON "schedule_items"("day", "period");

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
