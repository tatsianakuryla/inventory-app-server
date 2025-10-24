/*
  Warnings:

  - You are about to alter the column `customId` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(96)`.

*/
-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "customId" SET DATA TYPE VARCHAR(96);

-- CreateTable
CREATE TABLE "InventoryIdCounter" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InventoryIdCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryIdCounter_inventoryId_idx" ON "InventoryIdCounter"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryIdCounter_inventoryId_scopeKey_idx" ON "InventoryIdCounter"("inventoryId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryIdCounter_inventoryId_scopeKey_key" ON "InventoryIdCounter"("inventoryId", "scopeKey");

-- CreateIndex
CREATE INDEX "InventoryIdFormat_updatedAt_idx" ON "InventoryIdFormat"("updatedAt");

-- CreateIndex
CREATE INDEX "Item_inventoryId_createdAt_idx" ON "Item"("inventoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "InventoryIdCounter" ADD CONSTRAINT "InventoryIdCounter_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
