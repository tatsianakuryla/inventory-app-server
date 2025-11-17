/*
  Warnings:

  - A unique constraint covering the columns `[odooToken]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "odooToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_odooToken_key" ON "Inventory"("odooToken");
