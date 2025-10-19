/*
  Warnings:

  - You are about to drop the column `role` on the `InventoryAccess` table. All the data in the column will be lost.
  - Added the required column `inventoryRole` to the `InventoryAccess` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."InventoryAccess_inventoryId_role_idx";

-- AlterTable
ALTER TABLE "InventoryAccess" DROP COLUMN "role",
ADD COLUMN     "inventoryRole" "InventoryRole" NOT NULL;

-- CreateIndex
CREATE INDEX "InventoryAccess_inventoryId_inventoryRole_idx" ON "InventoryAccess"("inventoryId", "inventoryRole");
