-- AlterTable
ALTER TABLE "Caregiver" ADD COLUMN     "specialities" "AgeGroup"[] DEFAULT ARRAY[]::"AgeGroup"[];

-- CreateTable
CREATE TABLE "CenterReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,

    CONSTRAINT "CenterReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CenterReview_centerId_idx" ON "CenterReview"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "CenterReview_parentId_centerId_key" ON "CenterReview"("parentId", "centerId");

-- AddForeignKey
ALTER TABLE "CenterReview" ADD CONSTRAINT "CenterReview_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterReview" ADD CONSTRAINT "CenterReview_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "DaycareCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
