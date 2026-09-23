import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, BookingStatus } from "@prisma/client";
import { requireRole, jsonError } from "@/lib/api";

const ALLOWED: Set<BookingStatus> = new Set([
  BookingStatus.CONFIRMED,
  BookingStatus.REJECTED,
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(Role.PARENT, Role.PROVIDER, Role.ADMIN);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as BookingStatus | undefined;
  if (!status || !ALLOWED.has(status)) return jsonError("Invalid status");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { center: { select: { providerId: true } } },
  });
  if (!booking) return jsonError("Booking not found", 404);

  const { session } = auth;

  if (session.role === Role.PARENT) {
    if (booking.parentId !== session.userId)
      return jsonError("Forbidden", 403);
    if (status !== BookingStatus.CANCELLED)
      return jsonError("Parents can only cancel a booking");
  } else if (session.role === Role.PROVIDER) {
    if (booking.center.providerId !== session.userId)
      return jsonError("Forbidden", 403);
    if (status !== BookingStatus.CONFIRMED && status !== BookingStatus.REJECTED && status !== BookingStatus.COMPLETED)
      return jsonError("Providers can confirm, reject or complete a booking");
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      parent: { select: { id: true, name: true, email: true } },
      center: { select: { id: true, name: true, city: true } },
    },
  });

  return NextResponse.json({ booking: updated });
}
