import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, AgeGroup, Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine");

  // Providers can list their own centers (including unapproved ones).
  if (mine === "true") {
    const auth = await requireRole(Role.PROVIDER, Role.ADMIN);
    if (!auth.ok) return auth.response;
    const centers = await prisma.daycareCenter.findMany({
      where:
        auth.session.role === Role.ADMIN
          ? {}
          : { providerId: auth.session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        caregivers: { select: { id: true, name: true, verified: true } },
        _count: { select: { bookings: true } },
      },
    });
    return NextResponse.json({ centers, priceField: "priceDaily" });
  }

  const q = url.searchParams.get("q")?.trim();
  const city = url.searchParams.get("city")?.trim();
  const open24x7 = url.searchParams.get("open24x7");
  const ageGroup = url.searchParams.get("ageGroup");
  const timing = url.searchParams.get("timing"); // day | night | emergency
  const maxPrice = url.searchParams.get("maxPrice");
  const plan = url.searchParams.get("plan"); // hourly | daily | monthly

  const where: Prisma.DaycareCenterWhereInput = {
    approved: ApprovalStatus.APPROVED,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (city) where.city = { equals: city, mode: "insensitive" };

  // Night / emergency care requires a 24x7 center.
  if (open24x7 === "true" || timing === "night" || timing === "emergency") {
    where.open24x7 = true;
  }

  if (ageGroup && ageGroup in AgeGroup) {
    where.ageGroups = { has: ageGroup as AgeGroup };
  }

  const priceField =
    plan === "hourly"
      ? "priceHourly"
      : plan === "monthly"
      ? "priceMonthly"
      : "priceDaily";

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!Number.isNaN(max)) where[priceField] = { lte: max };
  }

  const centers = await prisma.daycareCenter.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      caregivers: { select: { id: true, name: true, verified: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ centers, priceField });
}

export async function POST(req: Request) {
  const auth = await requireRole(Role.PROVIDER);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const {
    name,
    description,
    address,
    city,
    open24x7,
    operatingHours,
    capacity,
    ageGroups,
    priceHourly,
    priceDaily,
    priceMonthly,
    certifications,
    safetyNotes,
  } = body;

  if (!name?.trim() || !address?.trim() || !city?.trim())
    return jsonError("Name, address and city are required");
  if (!Array.isArray(ageGroups) || ageGroups.length === 0)
    return jsonError("Select at least one age group");

  const validAges = ageGroups.filter((a: string) => a in AgeGroup) as AgeGroup[];
  if (validAges.length === 0) return jsonError("Invalid age group value");

  const center = await prisma.daycareCenter.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      address: address.trim(),
      city: city.trim(),
      open24x7: Boolean(open24x7),
      operatingHours: operatingHours?.trim() || null,
      capacity: Number(capacity) || 0,
      ageGroups: validAges,
      priceHourly: Number(priceHourly) || 0,
      priceDaily: Number(priceDaily) || 0,
      priceMonthly: Number(priceMonthly) || 0,
      certifications: Array.isArray(certifications)
        ? certifications.map(String)
        : [],
      safetyNotes: safetyNotes?.trim() || null,
      approved: ApprovalStatus.PENDING,
      providerId: auth.session.userId,
    },
  });

  return NextResponse.json({ center }, { status: 201 });
}
