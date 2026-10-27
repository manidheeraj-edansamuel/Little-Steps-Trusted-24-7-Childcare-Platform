import { PrismaClient, Role, ApprovalStatus, AgeGroup, PlanType, BookingStatus, SubscriptionStatus, NotificationType, PaymentStatus, PaymentMethod, CameraStreamType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  const password = await bcrypt.hash("password123", 10);

  // Wipe in dependency order.
  await prisma.centerReview.deleteMany();
  await prisma.cctvCamera.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.subscription.deleteMany();
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
        specialities: [AgeGroup.INFANT],
        centerId: center1.id,
      },
      {
        name: "Ramesh Kulkarni",
        title: "Night Supervisor",
        bio: "Oversees night shifts and emergency response.",
        experienceYears: 5,
        verified: true,
        certifications: ["Child First Aid"],
        specialities: [AgeGroup.TODDLER, AgeGroup.PRESCHOOL],
        centerId: center1.id,
      },
      {
        name: "Fatima Khan",
        title: "Caregiver",
        bio: "Toddler specialist with a focus on play-based learning.",
        experienceYears: 3,
        verified: true,
        certifications: ["Preschool Teaching"],
        specialities: [AgeGroup.TODDLER],
        centerId: center2.id,
      },
    ],
  });

  // Public test streams stand in for real NVR feeds so the player is demoable.
  await prisma.cctvCamera.createMany({
    data: [
      {
        name: "Play area",
        location: "Ground floor, supervised outdoor play",
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        type: CameraStreamType.HLS,
        centerId: center1.id,
      },
      {
        name: "Nap room",
        location: "First floor",
        streamUrl:
          "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
        type: CameraStreamType.MP4,
        centerId: center1.id,
      },
      {
        name: "Main gate",
        location: "Biometric entry",
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        type: CameraStreamType.HLS,
        active: false,
        centerId: center1.id,
      },
      {
        name: "Activity room",
        location: "Toddler bay",
        streamUrl:
          "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8",
        type: CameraStreamType.HLS,
        centerId: center2.id,
      },
    ],
  });

  const bookingPending = await prisma.booking.create({
    data: {
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
  });

  const bookingConfirmed = await prisma.booking.create({
    data: {
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
  });
  void bookingPending;

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sub1 = await prisma.subscription.create({
    data: {
      parentId: parent.id,
      centerId: center1.id,
      childName: "Aarav Sharma",
      ageGroup: AgeGroup.TODDLER,
      planType: PlanType.MONTHLY,
      pricePerPeriod: center1.priceMonthly,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      nextBillingDate: nextMonth,
    },
  });
  void sub1;

  await prisma.subscription.create({
    data: {
      parentId: parent.id,
      centerId: center2.id,
      childName: "Aarav Sharma",
      ageGroup: AgeGroup.INFANT,
      planType: PlanType.DAILY,
      pricePerPeriod: center2.priceDaily,
      status: SubscriptionStatus.PAUSED,
      startDate: new Date(),
      nextBillingDate: tomorrow,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: providerA.id,
        type: NotificationType.SUBSCRIPTION_CREATED,
        title: "New subscription",
        body: `Priya Sharma subscribed Aarav Sharma to ${center1.name} (monthly).`,
      },
      {
        userId: parent.id,
        type: NotificationType.BOOKING_UPDATED,
        title: "Booking confirmed",
        body: `Your booking at ${center2.name} was confirmed.`,
      },
      {
        userId: parent.id,
        type: NotificationType.BOOKING_CREATED,
        title: "Booking request sent",
        body: `Your booking request at ${center1.name} is pending confirmation.`,
        read: true,
      },
    ],
  });

  await prisma.payment.createMany({
    data: [
      {
        parentId: parent.id,
        amount: bookingConfirmed.totalPrice,
        method: PaymentMethod.CARD,
        status: PaymentStatus.SUCCESS,
        txnRef: "TXN-SEED-BOOKING-001",
        bookingId: bookingConfirmed.id,
        paidAt: new Date(),
      },
      {
        parentId: parent.id,
        amount: sub1.pricePerPeriod,
        method: PaymentMethod.UPI,
        status: PaymentStatus.SUCCESS,
        txnRef: "TXN-SEED-SUB-001",
        subscriptionId: sub1.id,
        periodStart: sub1.startDate,
        periodEnd: sub1.nextBillingDate,
        paidAt: new Date(),
      },
      {
        parentId: parent.id,
        amount: 900,
        method: PaymentMethod.NET_BANKING,
        status: PaymentStatus.FAILED,
        txnRef: "TXN-SEED-FAIL-001",
        subscriptionId: sub1.id,
      },
    ],
  });

  // Extra approved centers so the recommender has candidates to rank.
  const center4 = await prisma.daycareCenter.create({
    data: {
      name: "Little Stars Preschool & Daycare",
      description:
        "Play-focused preschool in Andheri with a strong nap-and-meals routine and open CCTV access for parents.",
      address: "9 Linking Road, Bandra",
      city: "Mumbai",
      open24x7: true,
      operatingHours: "Open 24 hours",
      capacity: 30,
      ageGroups: [AgeGroup.INFANT, AgeGroup.TODDLER, AgeGroup.PRESCHOOL],
      priceHourly: 140,
      priceDaily: 820,
      priceMonthly: 16500,
      certifications: ["ISO 9001", "CCTV Monitored"],
      approved: ApprovalStatus.APPROVED,
      providerId: providerA.id,
    },
  });

  const center5 = await prisma.daycareCenter.create({
    data: {
      name: "Sunbeam Kids Hub",
      description:
        "Neighbourhood daycare in HSR Layout for toddlers and preschoolers, with qualified early-years staff.",
      address: "22 27th Main, HSR Layout",
      city: "Bengaluru",
      operatingHours: "6:30 AM – 8:30 PM",
      capacity: 18,
      ageGroups: [AgeGroup.TODDLER, AgeGroup.PRESCHOOL],
      priceHourly: 110,
      priceDaily: 640,
      priceMonthly: 12500,
      certifications: ["Fire Safety", "Child First Aid"],
      approved: ApprovalStatus.APPROVED,
      providerId: providerA.id,
    },
  });

  await prisma.caregiver.createMany({
    data: [
      {
        name: "Vikram Nair",
        title: "Early Years Lead",
        bio: "Builds daily learning plans for preschool groups.",
        experienceYears: 10,
        verified: true,
        certifications: ["ECE Diploma", "Child First Aid"],
        specialities: [AgeGroup.PRESCHOOL, AgeGroup.TODDLER],
        centerId: center4.id,
      },
      {
        name: "Sneha Rao",
        title: "Caregiver",
        bio: "Newborn and infant sleep routines.",
        experienceYears: 4,
        verified: false,
        certifications: ["Infant CPR"],
        specialities: [AgeGroup.INFANT],
        centerId: center5.id,
      },
    ],
  });

  // Two more parents give the collaborative-filtering signal something to work with.
  const parent2 = await prisma.user.create({
    data: {
      name: "Kavya Iyer",
      email: "kavya@littlesteps.com",
      password,
      role: Role.PARENT,
      approved: ApprovalStatus.APPROVED,
    },
  });

  const parent3 = await prisma.user.create({
    data: {
      name: "Rohit Mehta",
      email: "rohit@littlesteps.com",
      password,
      role: Role.PARENT,
      approved: ApprovalStatus.APPROVED,
    },
  });

  await prisma.booking.createMany({
    data: [
      {
        parentId: parent2.id,
        centerId: center1.id,
        childName: "Riya Iyer",
        ageGroup: AgeGroup.TODDLER,
        planType: PlanType.DAILY,
        quantity: 10,
        startDate: new Date(),
        totalPrice: 900 * 10,
        status: BookingStatus.CONFIRMED,
      },
      {
        parentId: parent2.id,
        centerId: center4.id,
        childName: "Riya Iyer",
        ageGroup: AgeGroup.TODDLER,
        planType: PlanType.MONTHLY,
        quantity: 1,
        startDate: new Date(),
        totalPrice: center4.priceMonthly,
        status: BookingStatus.COMPLETED,
      },
      {
        parentId: parent3.id,
        centerId: center2.id,
        childName: "Vihaan Mehta",
        ageGroup: AgeGroup.INFANT,
        planType: PlanType.DAILY,
        quantity: 4,
        startDate: new Date(),
        totalPrice: center2.priceDaily * 4,
        status: BookingStatus.CONFIRMED,
      },
      {
        parentId: parent3.id,
        centerId: center3.id,
        childName: "Vihaan Mehta",
        ageGroup: AgeGroup.TODDLER,
        planType: PlanType.DAILY,
        quantity: 2,
        startDate: new Date(),
        totalPrice: center3.priceDaily * 2,
        status: BookingStatus.CONFIRMED,
      },
    ],
  });

  await prisma.subscription.create({
    data: {
      parentId: parent2.id,
      centerId: center4.id,
      childName: "Riya Iyer",
      ageGroup: AgeGroup.TODDLER,
      planType: PlanType.MONTHLY,
      pricePerPeriod: center4.priceMonthly,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      nextBillingDate: nextMonth,
    },
  });

  await prisma.centerReview.createMany({
    data: [
      {
        parentId: parent2.id,
        centerId: center1.id,
        rating: 5,
        comment: "Night shifts and the live feeds genuinely saved us during rotations.",
      },
      { parentId: parent2.id, centerId: center4.id, rating: 4, comment: "Great routine, food could be better." },
      { parentId: parent3.id, centerId: center2.id, rating: 4, comment: "Calm staff, quick responses." },
      { parentId: parent.id, centerId: center2.id, rating: 5, comment: "Aarav loves the nap room." },
      { parentId: parent3.id, centerId: center3.id, rating: 3 },
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
