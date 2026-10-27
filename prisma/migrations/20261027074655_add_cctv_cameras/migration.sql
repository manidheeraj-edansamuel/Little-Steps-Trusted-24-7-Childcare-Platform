-- CreateEnum
CREATE TYPE "CameraStreamType" AS ENUM ('HLS', 'MP4', 'IFRAME');

-- CreateTable
CREATE TABLE "CctvCamera" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "streamUrl" TEXT NOT NULL,
    "type" "CameraStreamType" NOT NULL DEFAULT 'HLS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "centerId" TEXT NOT NULL,

    CONSTRAINT "CctvCamera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CctvCamera_centerId_idx" ON "CctvCamera"("centerId");

-- AddForeignKey
ALTER TABLE "CctvCamera" ADD CONSTRAINT "CctvCamera_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "DaycareCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
