/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FieldState" AS ENUM ('HIDDEN', 'SHOWN');

-- DropIndex
DROP INDEX "public"."Inventory_name_idx";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "InventoryFields" (
    "inventoryId" TEXT NOT NULL,
    "text1State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "text1Name" TEXT,
    "text1Desc" TEXT,
    "text1ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "text2State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "text2Name" TEXT,
    "text2Desc" TEXT,
    "text2ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "text3State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "text3Name" TEXT,
    "text3Desc" TEXT,
    "text3ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "long1State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "long1Name" TEXT,
    "long1Desc" TEXT,
    "long1ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "long2State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "long2Name" TEXT,
    "long2Desc" TEXT,
    "long2ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "long3State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "long3Name" TEXT,
    "long3Desc" TEXT,
    "long3ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "num1State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "num1Name" TEXT,
    "num1Desc" TEXT,
    "num1ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "num2State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "num2Name" TEXT,
    "num2Desc" TEXT,
    "num2ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "num3State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "num3Name" TEXT,
    "num3Desc" TEXT,
    "num3ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "link1State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "link1Name" TEXT,
    "link1Desc" TEXT,
    "link1ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "link2State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "link2Name" TEXT,
    "link2Desc" TEXT,
    "link2ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "link3State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "link3Name" TEXT,
    "link3Desc" TEXT,
    "link3ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "bool1State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "bool1Name" TEXT,
    "bool1Desc" TEXT,
    "bool1ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "bool2State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "bool2Name" TEXT,
    "bool2Desc" TEXT,
    "bool2ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "bool3State" "FieldState" NOT NULL DEFAULT 'HIDDEN',
    "bool3Name" TEXT,
    "bool3Desc" TEXT,
    "bool3ShowInTable" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" JSONB,

    CONSTRAINT "InventoryFields_pkey" PRIMARY KEY ("inventoryId")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTag" (
    "inventoryId" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "InventoryTag_pkey" PRIMARY KEY ("inventoryId","tagId")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "text1" TEXT,
    "text2" TEXT,
    "text3" TEXT,
    "long1" TEXT,
    "long2" TEXT,
    "long3" TEXT,
    "num1" DOUBLE PRECISION,
    "num2" DOUBLE PRECISION,
    "num3" DOUBLE PRECISION,
    "link1" TEXT,
    "link2" TEXT,
    "link3" TEXT,
    "bool1" BOOLEAN,
    "bool2" BOOLEAN,
    "bool3" BOOLEAN,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemLike" (
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ItemLike_pkey" PRIMARY KEY ("itemId","userId")
);

-- CreateTable
CREATE TABLE "DiscussionPost" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "textMd" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryIdFormat" (
    "inventoryId" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryIdFormat_pkey" PRIMARY KEY ("inventoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "InventoryTag_tagId_idx" ON "InventoryTag"("tagId");

-- CreateIndex
CREATE INDEX "Item_inventoryId_idx" ON "Item"("inventoryId");

-- CreateIndex
CREATE INDEX "Item_id_version_idx" ON "Item"("id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Item_inventoryId_customId_key" ON "Item"("inventoryId", "customId");

-- CreateIndex
CREATE INDEX "ItemLike_userId_idx" ON "ItemLike"("userId");

-- CreateIndex
CREATE INDEX "DiscussionPost_inventoryId_createdAt_idx" ON "DiscussionPost"("inventoryId", "createdAt");

-- CreateIndex
CREATE INDEX "Inventory_categoryId_idx" ON "Inventory"("categoryId");

-- CreateIndex
CREATE INDEX "Inventory_isPublic_createdAt_idx" ON "Inventory"("isPublic", "createdAt");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryFields" ADD CONSTRAINT "InventoryFields_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTag" ADD CONSTRAINT "InventoryTag_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTag" ADD CONSTRAINT "InventoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemLike" ADD CONSTRAINT "ItemLike_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemLike" ADD CONSTRAINT "ItemLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryIdFormat" ADD CONSTRAINT "InventoryIdFormat_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
