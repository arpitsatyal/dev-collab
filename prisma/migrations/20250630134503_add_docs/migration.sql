-- CreateTable
CREATE TABLE "Doc" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doc_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Doc" ADD CONSTRAINT "Doc_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
