import { BookingStatus, SubscriptionStatus, type DaycareCenter } from "@prisma/client";
import { prisma } from "./prisma";

export type CareVenue = {
  center: DaycareCenter;
  source: "subscription" | "booking";
  since: Date;
};

/**
 * Centers a parent is currently enrolled in. Camera feeds are only ever exposed
 * for these — an expired or cancelled booking must not keep granting access.
 */
export async function activeCareVenues(parentId: string): Promise<CareVenue[]> {
  const now = new Date();

  const [subscriptions, bookings] = await Promise.all([
    prisma.subscription.findMany({
      where: { parentId, status: SubscriptionStatus.ACTIVE },
      include: { center: true },
    }),
    prisma.booking.findMany({
      where: {
        parentId,
        status: BookingStatus.CONFIRMED,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { center: true },
    }),
  ]);

  const byCenter = new Map<string, CareVenue>();
  for (const sub of subscriptions) {
    byCenter.set(sub.centerId, {
      center: sub.center,
      source: "subscription",
      since: sub.startDate,
    });
  }
  for (const booking of bookings) {
    const existing = byCenter.get(booking.centerId);
    if (!existing || existing.since > booking.startDate) {
      byCenter.set(booking.centerId, {
        center: booking.center,
        source: "booking",
        since: booking.startDate,
      });
    }
  }

  return [...byCenter.values()].sort((a, b) =>
    a.center.name.localeCompare(b.center.name)
  );
}

export async function parentHasActiveCare(
  parentId: string,
  centerId: string
): Promise<boolean> {
  const venues = await activeCareVenues(parentId);
  return venues.some((v) => v.center.id === centerId);
}
