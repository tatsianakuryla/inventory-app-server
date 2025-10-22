/*
  Warnings:

  - A unique constraint covering the columns `[id,version]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Item_id_version_key" ON "Item"("id", "version");
