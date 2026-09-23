import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const center = await prisma.daycareCenter.findUnique({
    where: { id },
    include: {
      caregivers: true,
      provider: { select: { id: true, name: true, email: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!center) return jsonError("Center not found", 404);

  // Only approved centers are public; owners and admins can always view.
  if (center.approved !== ApprovalStatus.APPROVED) {
    const session = await getSession();
    const isOwner = session?.userId === center.providerId;
    const isAdmin = session?.role === "ADMIN";
    if (!isOwner && !isAdmin) return jsonError("Center not found", 404);
  }

  return NextResponse.json({ center });
}
