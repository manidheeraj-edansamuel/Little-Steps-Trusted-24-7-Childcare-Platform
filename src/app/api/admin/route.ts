import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { Role, ApprovalStatus } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

export async function GET() {
  const auth = await requireRole(Role.ADMIN);
  if (!auth.ok) return auth.response;

  const [users, centers, bookings] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approved: true,
        createdAt: true,
        _count: { select: { centers: true, bookings: true } },
      },
    }),
    prisma.daycareCenter.findMany({
      orderBy: { createdAt: "desc" },
      include: { provider: { select: { id: true, name: true, email: true } } },
    }),
    prisma.booking.count(),
  ]);

  const stats = {
    totalUsers: users.length,
    totalParents: users.filter((u) => u.role === Role.PARENT).length,
    totalProviders: users.filter((u) => u.role === Role.PROVIDER).length,
    pendingProviders: users.filter(
      (u) => u.role === Role.PROVIDER && u.approved === ApprovalStatus.PENDING
    ).length,
    totalCenters: centers.length,
    pendingCenters: centers.filter(
      (c) => c.approved === ApprovalStatus.PENDING
    ).length,
    totalBookings: bookings,
  };

  return NextResponse.json({ users, centers, stats });
}

export async function PATCH(req: Request) {
  const auth = await requireRole(Role.ADMIN);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const { userId, centerId, status } = body ?? {};
  if (!(status in ApprovalStatus)) return jsonError("Invalid status");

  if (userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { approved: status as ApprovalStatus },
      select: { id: true, name: true, approved: true },
    });
    await notify(
      user.id,
      status === ApprovalStatus.APPROVED
        ? "ACCOUNT_APPROVED"
        : "ACCOUNT_REJECTED",
      `Account ${status.toLowerCase()}`,
      `Your Little Steps account has been ${status.toLowerCase()} by an administrator.`
    );
    return NextResponse.json({ user });
  }

  if (centerId) {
    const center = await prisma.daycareCenter.update({
      where: { id: centerId },
      data: { approved: status as ApprovalStatus },
      select: { id: true, name: true, approved: true, providerId: true },
    });
    await notify(
      center.providerId,
      status === ApprovalStatus.APPROVED
        ? "CENTER_APPROVED"
        : "CENTER_REJECTED",
      `Center ${status.toLowerCase()}`,
      `Your center "${center.name}" has been ${status.toLowerCase()} by an administrator.`
    );
    return NextResponse.json({ center });
  }

  return jsonError("userId or centerId is required");
}
