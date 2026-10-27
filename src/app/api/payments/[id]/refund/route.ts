import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { Role, PaymentStatus } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(Role.PROVIDER, Role.ADMIN);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      booking: { select: { id: true, childName: true, center: { select: { providerId: true, name: true } } } },
      subscription: { select: { id: true, childName: true, center: { select: { providerId: true, name: true } } } },
    },
  });
  if (!payment) return jsonError("Payment not found", 404);

  const providerId =
    payment.booking?.center.providerId ?? payment.subscription?.center.providerId;
  if (auth.session.role === Role.PROVIDER && providerId !== auth.session.userId)
    return jsonError("Forbidden", 403);

  if (payment.status !== PaymentStatus.SUCCESS)
    return jsonError("Only successful payments can be refunded");

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: PaymentStatus.REFUNDED },
  });

  const centerName = payment.booking?.center.name ?? payment.subscription?.center.name;
  const childName = payment.booking?.childName ?? payment.subscription?.childName;

  await notify(
    payment.parent.id,
    "PAYMENT_REFUNDED",
    "Payment refunded",
    `Your payment of ₹${payment.amount} for ${childName} at ${centerName} was refunded.`
  );

  return NextResponse.json({ payment: updated });
}
