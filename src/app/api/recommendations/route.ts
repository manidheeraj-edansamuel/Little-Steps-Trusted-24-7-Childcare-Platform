import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/api";
import { recommendCenters } from "@/lib/recommend-centers";
import { recommendCaregivers } from "@/lib/recommend-caregivers";

export async function GET(req: Request) {
  const auth = await requireRole(Role.PARENT);
  if (!auth.ok) return auth.response;

  const limit = Number(new URL(req.url).searchParams.get("limit")) || 4;

  const [centers, caregivers] = await Promise.all([
    recommendCenters(auth.session.userId, limit),
    recommendCaregivers(auth.session.userId, limit),
  ]);

  return NextResponse.json({ centers, caregivers });
}
