-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('INFANT', 'TODDLER', 'PRESCHOOL');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('HOURLY', 'DAILY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "approved" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DaycareCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "open24x7" BOOLEAN NOT NULL DEFAULT false,
    "operatingHours" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "ageGroups" "AgeGroup"[],
    "priceHourly" INTEGER NOT NULL DEFAULT 0,
    "priceDaily" INTEGER NOT NULL DEFAULT 0,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "photos" TEXT[],
    "certifications" TEXT[],
    "safetyNotes" TEXT,
    "approved" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "DaycareCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "certifications" TEXT[],
    "photoUrl" TEXT,
    "centerId" TEXT NOT NULL,

    CONSTRAINT "Caregiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "planType" "PlanType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DaycareCenter_city_idx" ON "DaycareCenter"("city");

-- CreateIndex
CREATE INDEX "DaycareCenter_approved_idx" ON "DaycareCenter"("approved");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_parentId_idx" ON "Booking"("parentId");

-- CreateIndex
CREATE INDEX "Booking_centerId_idx" ON "Booking"("centerId");

-- AddForeignKey
ALTER TABLE "DaycareCenter" ADD CONSTRAINT "DaycareCenter_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caregiver" ADD CONSTRAINT "Caregiver_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "DaycareCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "DaycareCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
