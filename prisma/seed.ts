import { PrismaClient, Role, ApprovalStatus, AgeGroup, PlanType, BookingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  const password = await bcrypt.hash("password123", 10);

  // Wipe in dependency order.
  await prisma.booking.deleteMany();
  await prisma.caregiver.deleteMany();
  await prisma.daycareCenter.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@littlesteps.com",
      password,
      role: Role.ADMIN,
      approved: ApprovalStatus.APPROVED,
    },
  });

  const providerA = await prisma.user.create({
    data: {
      name: "Sunshine Care Pvt Ltd",
      email: "provider@littlesteps.com",
      password,
      phone: "+91 98000 00001",
      role: Role.PROVIDER,
      approved: ApprovalStatus.APPROVED,
    },
  });

  const providerB = await prisma.user.create({
    data: {
      name: "Tiny Tots Trust",
      email: "pending@littlesteps.com",
      password,
      role: Role.PROVIDER,
      approved: ApprovalStatus.PENDING,
    },
  });

  const parent = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "parent@littlesteps.com",
      password,
      phone: "+91 98000 00002",
      role: Role.PARENT,
      approved: ApprovalStatus.APPROVED,
    },
  });

  const center1 = await prisma.daycareCenter.create({
    data: {
      name: "Sunshine 24×7 Daycare",
      description:
        "A round-the-clock daycare in the heart of Mumbai with CCTV-monitored play areas, nutritious meals and trained caregivers for all age groups.",
      address: "12 Marine Drive, Fort",
      city: "Mumbai",
      open24x7: true,
      operatingHours: "Open 24 hours",
      capacity: 40,
      ageGroups: [AgeGroup.INFANT, AgeGroup.TODDLER, AgeGroup.PRESCHOOL],
      priceHourly: 150,
      priceDaily: 900,
      priceMonthly: 18000,
      certifications: ["ISO 9001", "Fire Safety", "CCTV Monitored"],
      safetyNotes:
        "Biometric entry, 24×7 CCTV, first-aid trained staff on every shift.",
      approved: ApprovalStatus.APPROVED,
      providerId: providerA.id,
    },
  });

  const center2 = await prisma.daycareCenter.create({
    data: {
      name: "Little Sprouts Crèche",
      description:
        "A calm, home-style crèche in Bengaluru focused on infants and toddlers, with flexible day plans.",
      address: "45 Indiranagar 100ft Road",
      city: "Bengaluru",
      open24x7: false,
      operatingHours: "7:00 AM – 9:00 PM",
      capacity: 20,
      ageGroups: [AgeGroup.INFANT, AgeGroup.TODDLER],
      priceHourly: 120,
      priceDaily: 700,
      priceMonthly: 14000,
      certifications: ["Fire Safety"],
      safetyNotes: "Gated premises with supervised nap rooms.",
      approved: ApprovalStatus.APPROVED,
      providerId: providerA.id,
    },
  });

  const center3 = await prisma.daycareCenter.create({
    data: {
      name: "Night Owls Emergency Care",
      description:
        "Specializing in night-shift and emergency childcare for hospital and IT professionals in Pune.",
      address: "7 Baner Road",
      city: "Pune",
      open24x7: true,
      operatingHours: "Open 24 hours",
      capacity: 25,
      ageGroups: [AgeGroup.TODDLER, AgeGroup.PRESCHOOL],
      priceHourly: 180,
      priceDaily: 1100,
      priceMonthly: 22000,
      certifications: ["ISO 9001", "CCTV Monitored"],
      approved: ApprovalStatus.PENDING,
      providerId: providerB.id,
    },
  });

  await prisma.caregiver.createMany({
    data: [
      {
        name: "Anita Desai",
        title: "Lead Caregiver",
        bio: "Specializes in infant care and early childhood development.",
        experienceYears: 8,
        verified: true,
        certifications: ["Child First Aid", "ECE Diploma"],
        centerId: center1.id,
      },
      {
        name: "Ramesh Kulkarni",
        title: "Night Supervisor",
        bio: "Oversees night shifts and emergency response.",
        experienceYears: 5,
        verified: true,
        certifications: ["Child First Aid"],
        centerId: center1.id,
      },
      {
        name: "Fatima Khan",
        title: "Caregiver",
        bio: "Toddler specialist with a focus on play-based learning.",
        experienceYears: 3,
        verified: true,
        certifications: ["Preschool Teaching"],
        centerId: center2.id,
      },
    ],
  });

  await prisma.booking.createMany({
    data: [
      {
        parentId: parent.id,
        centerId: center1.id,
        childName: "Aarav Sharma",
        ageGroup: AgeGroup.TODDLER,
        planType: PlanType.DAILY,
        quantity: 5,
        startDate: new Date(),
        totalPrice: 900 * 5,
        status: BookingStatus.PENDING,
        notes: "Needs evening pickup around 8 PM.",
      },
      {
        parentId: parent.id,
        centerId: center2.id,
        childName: "Aarav Sharma",
        ageGroup: AgeGroup.INFANT,
        planType: PlanType.MONTHLY,
        quantity: 1,
        startDate: new Date(),
        totalPrice: 14000,
        status: BookingStatus.CONFIRMED,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("\nDemo accounts (password: password123):");
  console.log("  Admin:    admin@littlesteps.com");
  console.log("  Provider: provider@littlesteps.com  (approved)");
  console.log("  Provider: pending@littlesteps.com   (awaiting approval)");
  console.log("  Parent:   parent@littlesteps.com");
  console.log(`\nAdmin user id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
