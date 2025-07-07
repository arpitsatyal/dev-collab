/*
  Warnings:

  - A unique constraint covering the columns `[roomId]` on the table `Doc` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roomId` to the `Doc` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doc" ADD COLUMN     "roomId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Doc_roomId_key" ON "Doc"("roomId");
