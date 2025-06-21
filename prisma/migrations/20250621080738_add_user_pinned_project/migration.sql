/*
  Warnings:

  - You are about to drop the column `isPinned` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "isPinned";

-- CreateTable
CREATE TABLE "UserPinnedProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "UserPinnedProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPinnedProject_userId_projectId_key" ON "UserPinnedProject"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "UserPinnedProject" ADD CONSTRAINT "UserPinnedProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPinnedProject" ADD CONSTRAINT "UserPinnedProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
