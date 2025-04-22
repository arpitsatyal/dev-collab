-- AlterTable
ALTER TABLE "Snippet" ADD COLUMN     "lastEditedById" TEXT;

-- AddForeignKey
ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
