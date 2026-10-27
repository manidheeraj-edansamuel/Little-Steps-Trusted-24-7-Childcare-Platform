import { ApprovalStatus, type AgeGroup as Age } from "@prisma/client";
import { prisma } from "./prisma";
import { bayesianRating, parentHistory } from "./recommend";

export type CaregiverRecommendation = {
  caregiverId: string;
  name: string;
  title: string | null;
  experienceYears: number;
  verified: boolean;
  specialities: string[];
  centerId: string;
  centerName: string;
  atYourCenter: boolean;
  score: number;
  reasons: string[];
};

const AGE_LABEL: Record<Age, string> = {
  INFANT: "infants",
  TODDLER: "toddlers",
  PRESCHOOL: "preschoolers",
};

export async function recommendCaregivers(
  parentId: string,
  limit = 4
): Promise<CaregiverRecommendation[]> {
  const history = await parentHistory(parentId);

  const [caregivers, reviewAgg] = await Promise.all([
    prisma.caregiver.findMany({
      where: { center: { approved: ApprovalStatus.APPROVED } },
      select: {
        id: true,
        name: true,
        title: true,
        experienceYears: true,
        verified: true,
        specialities: true,
        certifications: true,
        centerId: true,
        center: { select: { name: true, city: true } },
      },
    }),
    prisma.centerReview.groupBy({
      by: ["centerId"],
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const reviewBy = new Map(reviewAgg.map((r) => [r.centerId, r]));

  return caregivers
    .map((cg) => {
      const agg = reviewBy.get(cg.centerId);
      const rating = bayesianRating(agg?._count._all ?? 0, agg?._avg.rating ?? null);
      const matched = cg.specialities.filter((a) => history.ageGroups.has(a as Age)) as Age[];
      const atYourCenter = history.centerIds.has(cg.centerId);

      const ageFit = !history.ageGroups.size
        ? 0.6
        : matched.length > 0
          ? 1
          : cg.specialities.length === 0
            ? 0.4
            : 0;
      const localityFit =
        atYourCenter || history.cities.has(cg.center.city) ? 1 : 0.3;

      const score =
        30 * ageFit +
        20 * (cg.verified ? 1 : 0) +
        20 * Math.min(1, cg.experienceYears / 8) +
        15 * ((rating - 1) / 4) +
        15 * localityFit;

      const reasons: string[] = [];
      if (matched.length > 0)
        reasons.push(`Specialises in ${matched.map((a) => AGE_LABEL[a]).join(" & ")}`);
      if (cg.verified) reasons.push("Background verified");
      if (cg.experienceYears >= 5) reasons.push(`${cg.experienceYears} yrs experience`);
      if ((agg?._count._all ?? 0) > 0 && rating >= 4)
        reasons.push(`At a ${rating.toFixed(1)}★ rated center`);
      if (atYourCenter) reasons.push(`Works at ${cg.center.name}`);
      if (cg.certifications.length > 0)
        reasons.push(cg.certifications.slice(0, 2).join(", "));

      return {
        caregiverId: cg.id,
        name: cg.name,
        title: cg.title,
        experienceYears: cg.experienceYears,
        verified: cg.verified,
        specialities: cg.specialities,
        centerId: cg.centerId,
        centerName: cg.center.name,
        atYourCenter,
        score: Math.round(score),
        reasons: reasons.slice(0, 3),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
