import { type AgeGroup as Age } from "@prisma/client";
import { prisma } from "./prisma";

/** Feature weights, summing to 100 so the score reads like a percentage fit. */
export const WEIGHTS = {
  ageFit: 22,
  locality: 14,
  priceFit: 16,
  rating: 20,
  safety: 10,
  availability: 8,
  neighbours: 10,
};

const PRIOR_RATING = 3.5;
const PRIOR_COUNT = 5;

export type CenterHistory = {
  centerIds: Set<string>;
  ageGroups: Set<Age>;
  cities: Set<string>;
  dailyBudgets: number[];
  wants24x7: boolean;
};

/** Rupees per day, so hourly / daily / monthly plans are comparable. */
function perDay(plan: string, price: number, quantity = 1): number {
  const units = Math.max(1, quantity);
  const days = plan === "MONTHLY" ? 30 : plan === "HOURLY" ? 1 / 8 : 1;
  return Math.round(price / (units * days));
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Shrink sparse review averages toward the global prior so one 5★ review wins. */
export function bayesianRating(count: number, avg: number | null): number {
  const observed = avg ?? 0;
  return (observed * count + PRIOR_RATING * PRIOR_COUNT) / (count + PRIOR_COUNT);
}

export async function parentHistory(parentId: string): Promise<CenterHistory> {
  const [bookings, subscriptions] = await Promise.all([
    prisma.booking.findMany({
      where: { parentId },
      select: {
        centerId: true,
        ageGroup: true,
        planType: true,
        quantity: true,
        totalPrice: true,
        center: { select: { city: true, open24x7: true } },
      },
    }),
    prisma.subscription.findMany({
      where: { parentId },
      select: {
        centerId: true,
        ageGroup: true,
        planType: true,
        pricePerPeriod: true,
        center: { select: { city: true, open24x7: true } },
      },
    }),
  ]);

  const history: CenterHistory = {
    centerIds: new Set(),
    ageGroups: new Set<Age>(),
    cities: new Set(),
    dailyBudgets: [],
    wants24x7: false,
  };

  for (const b of bookings) {
    history.centerIds.add(b.centerId);
    history.ageGroups.add(b.ageGroup as Age);
    history.cities.add(b.center.city);
    history.dailyBudgets.push(perDay(b.planType, b.totalPrice, b.quantity));
    if (b.center.open24x7) history.wants24x7 = true;
  }
  for (const s of subscriptions) {
    history.centerIds.add(s.centerId);
    history.ageGroups.add(s.ageGroup as Age);
    history.cities.add(s.center.city);
    history.dailyBudgets.push(perDay(s.planType, s.pricePerPeriod));
    if (s.center.open24x7) history.wants24x7 = true;
  }

  return history;
}

/**
 * Item-based collaborative filtering: how often do the parents who used this
 * parent's centers also use the candidate center?
 */
export async function neighbourScores(
  centerIds: string[]
): Promise<Map<string, number>> {
  if (centerIds.length === 0) return new Map();

  const cohort = await prisma.booking.findMany({
    where: { centerId: { in: centerIds } },
    select: { parentId: true },
  });
  const cohortSubs = await prisma.subscription.findMany({
    where: { centerId: { in: centerIds } },
    select: { parentId: true },
  });
  const cohortIds = [...new Set([...cohort, ...cohortSubs].map((r) => r.parentId))];
  if (cohortIds.length === 0) return new Map();

  const others = await prisma.booking.findMany({
    where: { parentId: { in: cohortIds }, NOT: { centerId: { in: centerIds } } },
    select: { centerId: true, parentId: true },
  });
  const otherSubs = await prisma.subscription.findMany({
    where: { parentId: { in: cohortIds }, NOT: { centerId: { in: centerIds } } },
    select: { centerId: true, parentId: true },
  });

  const parentsPerCenter = new Map<string, Set<string>>();
  for (const row of [...others, ...otherSubs]) {
    if (!parentsPerCenter.has(row.centerId)) parentsPerCenter.set(row.centerId, new Set());
    parentsPerCenter.get(row.centerId)!.add(row.parentId);
  }

  const scores = new Map<string, number>();
  for (const [centerId, parents] of parentsPerCenter) {
    scores.set(centerId, parents.size / cohortIds.length);
  }
  return scores;
}
