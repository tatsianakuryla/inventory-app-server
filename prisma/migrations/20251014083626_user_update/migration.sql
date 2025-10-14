/*
  Warnings:

  - You are about to drop the column `isBlocked` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('BLOCKED', 'ACTIVE');

-- DropIndex
DROP INDEX "public"."User_isBlocked_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isBlocked",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");
