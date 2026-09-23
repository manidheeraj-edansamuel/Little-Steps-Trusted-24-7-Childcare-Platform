import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, PlanType, AgeGroup, ApprovalStatus, BookingStatus } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

export async function POST(req: Request) {
  const auth = await requireRole(Role.PARENT);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const { centerId, childName, ageGroup, planType, quantity, startDate, endDate, notes } = body;

  if (!centerId || !childName?.trim() || !startDate)
    return jsonError("centerId, childName and startDate are required");
  if (!(ageGroup in AgeGroup)) return jsonError("Invalid age group");
  if (!(planType in PlanType)) return jsonError("Invalid plan type");

  const center = await prisma.daycareCenter.findUnique({ where: { id: centerId } });
  if (!center || center.approved !== ApprovalStatus.APPROVED)
    return jsonError("Center not available for booking", 404);

  const qty = Math.max(1, Number(quantity) || 1);
  const unit =
    planType === PlanType.HOURLY
      ? center.priceHourly
      : planType === PlanType.MONTHLY
      ? center.priceMonthly
      : center.priceDaily;

  const booking = await prisma.booking.create({
    data: {
      parentId: auth.session.userId,
      centerId,
      childName: childName.trim(),
      ageGroup: ageGroup as AgeGroup,
      planType: planType as PlanType,
      quantity: qty,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      totalPrice: unit * qty,
      notes: notes?.trim() || null,
      status: BookingStatus.PENDING,
    },
    include: { center: { select: { id: true, name: true, city: true } } },
  });

  return NextResponse.json({ booking }, { status: 201 });
}

export async function GET() {
  const auth = await requireRole(Role.PARENT, Role.PROVIDER, Role.ADMIN);
  if (!auth.ok) return auth.response;

  const { session } = auth;

  const where =
    session.role === Role.ADMIN
      ? {}
      : session.role === Role.PARENT
      ? { parentId: session.userId }
      : { center: { providerId: session.userId } };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { id: true, name: true, email: true, phone: true } },
      center: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          providerId: true,
        },
      },
    },
  });

  return NextResponse.json({ bookings });
}
