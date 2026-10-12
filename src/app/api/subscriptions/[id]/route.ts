import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { Role, SubscriptionStatus } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

const ALLOWED: Set<SubscriptionStatus> = new Set([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAUSED,
  SubscriptionStatus.CANCELLED,
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(Role.PARENT, Role.PROVIDER, Role.ADMIN);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as SubscriptionStatus | undefined;
  if (!status || !ALLOWED.has(status)) return jsonError("Invalid status");

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { center: { select: { providerId: true, name: true } } },
  });
  if (!subscription) return jsonError("Subscription not found", 404);

  const { session } = auth;

  if (session.role === Role.PARENT) {
    if (subscription.parentId !== session.userId)
      return jsonError("Forbidden", 403);
  } else if (session.role === Role.PROVIDER) {
    if (subscription.center.providerId !== session.userId)
      return jsonError("Forbidden", 403);
    if (status !== SubscriptionStatus.CANCELLED)
      return jsonError("Providers can only cancel a subscription");
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { status },
    include: { center: { select: { id: true, name: true } } },
  });

  const targetId =
    session.role === Role.PARENT ? subscription.center.providerId : subscription.parentId;

  await notify(
    targetId,
    status === SubscriptionStatus.CANCELLED
      ? "SUBSCRIPTION_CANCELLED"
      : "SUBSCRIPTION_UPDATED",
    `Subscription ${status.toLowerCase()}`,
    `The subscription for ${updated.childName} at ${updated.center.name} is now ${status.toLowerCase()}.`
  );

  return NextResponse.json({ subscription: updated });
}
