import {
  ApprovalStatus,
  BookingStatus,
  SubscriptionStatus,
  type AgeGroup as Age,
} from "@prisma/client";
import { prisma } from "./prisma";
import {
  WEIGHTS,
  bayesianRating,
  median,
  neighbourScores,
  parentHistory,
} from "./recommend";

export type CenterRecommendation = {
  centerId: string;
  name: string;
  city: string;
  open24x7: boolean;
  priceDaily: number;
  score: number;
  reasons: { label: string; weight: number }[];
};

const AGE_LABEL: Record<Age, string> = {
  INFANT: "infant",
  TODDLER: "toddler",
  PRESCHOOL: "preschool",
};

export async function recommendCenters(
  parentId: string,
  limit = 4
): Promise<CenterRecommendation[]> {
  const history = await parentHistory(parentId);
  const seen = [...history.centerIds];

  const [centers, reviewAgg, bookingAgg, subAgg, neighbours] = await Promise.all([
    prisma.daycareCenter.findMany({
      where: {
        approved: ApprovalStatus.APPROVED,
        // Don't recommend centers the parent already uses.
        ...(seen.length > 0 ? { NOT: { id: { in: seen } } } : {}),
      },
      include: { caregivers: { select: { verified: true, experienceYears: true } } },
    }),
    prisma.centerReview.groupBy({
      by: ["centerId"],
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["centerId"],
      where: {
        status: BookingStatus.CONFIRMED,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ["centerId"],
      where: { status: SubscriptionStatus.ACTIVE },
      _count: { _all: true },
    }),
    neighbourScores(seen),
  ]);

  const reviewBy = new Map(reviewAgg.map((r) => [r.centerId, r]));
  const enrolledBy = new Map<string, number>();
  for (const row of [...bookingAgg, ...subAgg])
    enrolledBy.set(row.centerId, (enrolledBy.get(row.centerId) ?? 0) + row._count._all);

  const budget = median(history.dailyBudgets);

  return centers
    .map((center) => {
      const agg = reviewBy.get(center.id);
      const reviewCount = agg?._count._all ?? 0;
      const rating = bayesianRating(reviewCount, agg?._avg.rating ?? null);
      const verifiedRatio = center.caregivers.length
        ? center.caregivers.filter((c) => c.verified).length / center.caregivers.length
        : 0;
      const maxExp = Math.max(0, ...center.caregivers.map((c) => c.experienceYears));
      const matchedAges = center.ageGroups.filter((a) => history.ageGroups.has(a)) as Age[];
      const enrolled = enrolledBy.get(center.id) ?? 0;
      const f = {
        ageFit: history.ageGroups.size ? matchedAges.length / history.ageGroups.size : 0.6,
        locality: !history.cities.size
          ? 0.5
          : history.cities.has(center.city)
            ? 1
            : center.open24x7 && history.wants24x7
              ? 0.5
              : 0,
        priceFit:
          budget === null || center.priceDaily <= 0
            ? 0.6
            : Math.max(0, 1 - Math.abs(Math.log(center.priceDaily / budget)) / Math.log(2)),
        rating: (rating - 1) / 4,
        safety: verifiedRatio * 0.6 + Math.min(1, maxExp / 8) * 0.4,
        availability: center.capacity <= 0 ? 0.5 : Math.max(0, 1 - enrolled / center.capacity),
        neighbours: Math.min(1, neighbours.get(center.id) ?? 0),
      };

      const candidates: [number, boolean, string][] = [
        [WEIGHTS.ageFit, f.ageFit >= 0.6 && matchedAges.length > 0,
          `Cares for ${matchedAges.map((a) => AGE_LABEL[a]).join(" & ")}`],
        [WEIGHTS.locality, f.locality >= 0.9, `Already in ${center.city}`],
        [WEIGHTS.locality, center.open24x7 && f.locality >= 0.5,
          "Round-the-clock like your current care"],
        [WEIGHTS.priceFit, f.priceFit >= 0.7,
          `₹${center.priceDaily}/day fits your usual spend`],
        [WEIGHTS.rating, reviewCount > 0 && f.rating >= 0.65,
          `Rated ${rating.toFixed(1)}★ by ${reviewCount} parent${reviewCount === 1 ? "" : "s"}`],
        [WEIGHTS.safety, f.safety >= 0.55,
          `${Math.round(verifiedRatio * 100)}% verified caregivers, up to ${maxExp} yrs experience`],
        [WEIGHTS.availability, f.availability >= 0.7 && center.capacity > 0,
          `${Math.max(0, center.capacity - enrolled)} of ${center.capacity} places free`],
        [WEIGHTS.neighbours, f.neighbours >= 0.25,
          "Popular with families who use your centers"],
      ];

      const penalty = history.wants24x7 && !center.open24x7 ? 0.6 : 1;
      const score =
        (WEIGHTS.ageFit * f.ageFit +
          WEIGHTS.locality * f.locality +
          WEIGHTS.priceFit * f.priceFit +
          WEIGHTS.rating * f.rating +
          WEIGHTS.safety * f.safety +
          WEIGHTS.availability * f.availability +
          WEIGHTS.neighbours * f.neighbours) *
        penalty;

      return {
        centerId: center.id,
        name: center.name,
        city: center.city,
        open24x7: center.open24x7,
        priceDaily: center.priceDaily,
        score: Math.round(score),
        reasons: candidates
          .filter(([, hit]) => hit)
          .map(([weight, , label]) => ({ weight, label }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 3),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
