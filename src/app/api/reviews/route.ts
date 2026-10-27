import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus, Role, SubscriptionStatus } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

export async function GET(req: Request) {
  const centerId = new URL(req.url).searchParams.get("centerId");
  if (!centerId) return jsonError("centerId is required");

  const reviews = await prisma.centerReview.findMany({
    where: { centerId },
    orderBy: { createdAt: "desc" },
    include: { parent: { select: { name: true } } },
  });

  const avg =
    reviews.length === 0
      ? null
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return NextResponse.json({ reviews, average: avg, count: reviews.length });
}

export async function POST(req: Request) {
  const auth = await requireRole(Role.PARENT);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const { centerId, rating, comment } = body ?? {};

  if (!centerId) return jsonError("centerId is required");
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5)
    return jsonError("Rating must be a whole number from 1 to 5");

  // Only parents who actually used the center may review it.
  const [bookingCount, subscriptionCount] = await Promise.all([
    prisma.booking.count({
      where: {
        parentId: auth.session.userId,
        centerId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    prisma.subscription.count({
      where: {
        parentId: auth.session.userId,
        centerId,
        status: { not: SubscriptionStatus.CANCELLED },
      },
    }),
  ]);
  if (bookingCount === 0 && subscriptionCount === 0)
    return jsonError("You can review a center only after booking or subscribing.", 403);

  const review = await prisma.centerReview.upsert({
    where: {
      parentId_centerId: { parentId: auth.session.userId, centerId },
    },
    create: {
      parentId: auth.session.userId,
      centerId,
      rating: value,
      comment: comment?.trim() || null,
    },
    update: { rating: value, comment: comment?.trim() || null },
  });

  return NextResponse.json({ review }, { status: 201 });
}
