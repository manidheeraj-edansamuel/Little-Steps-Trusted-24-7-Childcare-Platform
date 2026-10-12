import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { Role, PlanType, AgeGroup, ApprovalStatus, SubscriptionStatus } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

function addPeriod(date: Date, planType: PlanType): Date {
  const d = new Date(date);
  if (planType === PlanType.MONTHLY) d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 1);
  return d;
}

export async function POST(req: Request) {
  const auth = await requireRole(Role.PARENT);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const { centerId, childName, ageGroup, planType, startDate } = body;

  if (!centerId || !childName?.trim())
    return jsonError("centerId and childName are required");
  if (!(ageGroup in AgeGroup)) return jsonError("Invalid age group");

  const recurring =
    planType === PlanType.MONTHLY ? PlanType.MONTHLY : PlanType.DAILY;

  const center = await prisma.daycareCenter.findUnique({ where: { id: centerId } });
  if (!center || center.approved !== ApprovalStatus.APPROVED)
    return jsonError("Center not available", 404);

  const start = startDate ? new Date(startDate) : new Date();
  const pricePerPeriod =
    recurring === PlanType.MONTHLY ? center.priceMonthly : center.priceDaily;

  const subscription = await prisma.subscription.create({
    data: {
      parentId: auth.session.userId,
      centerId,
      childName: childName.trim(),
      ageGroup: ageGroup as AgeGroup,
      planType: recurring,
      pricePerPeriod,
      status: SubscriptionStatus.ACTIVE,
      startDate: start,
      nextBillingDate: addPeriod(start, recurring),
    },
    include: { center: { select: { id: true, name: true, city: true } } },
  });

  await notify(
    center.providerId,
    "SUBSCRIPTION_CREATED",
    "New subscription",
    `${auth.session.name} subscribed ${subscription.childName} to ${center.name} (${recurring.toLowerCase()}).`
  );

  return NextResponse.json({ subscription }, { status: 201 });
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

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { id: true, name: true, email: true } },
      center: { select: { id: true, name: true, city: true, providerId: true } },
    },
  });

  return NextResponse.json({ subscriptions });
}
