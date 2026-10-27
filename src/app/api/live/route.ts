import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeCareVenues } from "@/lib/access";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/api";

export async function GET() {
  const auth = await requireRole(Role.PARENT);
  if (!auth.ok) return auth.response;

  const venues = await activeCareVenues(auth.session.userId);

  const result = await Promise.all(
    venues.map(async (v) => ({
      centerId: v.center.id,
      centerName: v.center.name,
      city: v.center.city,
      open24x7: v.center.open24x7,
      source: v.source,
      since: v.since,
      cameras: await prisma.cctvCamera.count({
        where: { centerId: v.center.id, active: true },
      }),
    }))
  );

  return NextResponse.json({ venues: result });
}
