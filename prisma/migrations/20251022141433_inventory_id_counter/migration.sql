/*
  Warnings:

  - Added the required column `updatedAt` to the `InventoryIdCounter` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."InventoryIdCounter_inventoryId_scopeKey_idx";

-- AlterTable
ALTER TABLE "InventoryIdCounter" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
