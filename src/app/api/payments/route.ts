import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import {
  Role,
  PaymentMethod,
  PaymentStatus,
  BookingStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";
import { addPeriod, makeTxnRef } from "@/lib/billing";

export async function POST(req: Request) {
  const auth = await requireRole(Role.PARENT);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const { bookingId, subscriptionId, method, simulateFailure } = body;
  if (!(method in PaymentMethod)) return jsonError("Invalid payment method");
  if ((bookingId ? 1 : 0) + (subscriptionId ? 1 : 0) !== 1)
    return jsonError("Provide exactly one of bookingId or subscriptionId");

  const parent = auth.session;
  let amount = 0;
  let providerId = "";
  let label = "";
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;

  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { center: { select: { providerId: true, name: true } } },
    });
    if (!booking || booking.parentId !== parent.userId)
      return jsonError("Booking not found", 404);
    if (booking.status !== BookingStatus.CONFIRMED)
      return jsonError("Only confirmed bookings can be paid");
    const existing = await prisma.payment.findFirst({
      where: { bookingId, status: PaymentStatus.SUCCESS },
    });
    if (existing) return jsonError("This booking is already paid");
    amount = booking.totalPrice;
    providerId = booking.center.providerId;
    label = `booking for ${booking.childName} at ${booking.center.name}`;
  } else {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { center: { select: { providerId: true, name: true } } },
    });
    if (!subscription || subscription.parentId !== parent.userId)
      return jsonError("Subscription not found", 404);
    if (subscription.status !== SubscriptionStatus.ACTIVE)
      return jsonError("Only active subscriptions can be billed");
    amount = subscription.pricePerPeriod;
    providerId = subscription.center.providerId;
    label = `${subscription.planType.toLowerCase()} subscription for ${subscription.childName} at ${subscription.center.name}`;
    periodStart = new Date(subscription.nextBillingDate);
    periodEnd = addPeriod(subscription.nextBillingDate, subscription.planType);
  }

  const payment = await prisma.payment.create({
    data: {
      parentId: parent.userId,
      amount,
      method: method as PaymentMethod,
      status: PaymentStatus.PENDING,
      txnRef: makeTxnRef(),
      bookingId: bookingId || null,
      subscriptionId: subscriptionId || null,
      periodStart,
      periodEnd,
    },
  });

  // Mock gateway: settle immediately.
  const succeeded = !simulateFailure;
  const settled = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: succeeded ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      paidAt: succeeded ? new Date() : null,
    },
    include: {
      booking: { select: { id: true, childName: true } },
      subscription: { select: { id: true, childName: true, planType: true } },
    },
  });

  if (succeeded && subscriptionId && periodEnd) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { nextBillingDate: periodEnd },
    });
  }

  if (succeeded) {
    await notify(
      providerId,
      "PAYMENT_SUCCESS",
      "Payment received",
      `${parent.name} paid ₹${amount} for the ${label}.`
    );
  } else {
    await notify(
      parent.userId,
      "PAYMENT_FAILED",
      "Payment failed",
      `Your payment of ₹${amount} for the ${label} failed. No money was deducted.`
    );
  }

  return NextResponse.json({ payment: settled }, { status: 201 });
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
      : {
          OR: [
            { booking: { center: { providerId: session.userId } } },
            { subscription: { center: { providerId: session.userId } } },
          ],
        };

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { id: true, name: true, email: true } },
      booking: {
        select: {
          id: true,
          childName: true,
          center: { select: { id: true, name: true } },
        },
      },
      subscription: {
        select: {
          id: true,
          childName: true,
          planType: true,
          center: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ payments });
}
