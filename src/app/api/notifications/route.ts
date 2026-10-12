import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, jsonError } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: auth.session.userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.session.userId, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const { id, all } = body ?? {};

  if (all === true) {
    await prisma.notification.updateMany({
      where: { userId: auth.session.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (typeof id === "string") {
    const notification = await prisma.notification.findFirst({
      where: { id, userId: auth.session.userId },
    });
    if (!notification) return jsonError("Notification not found", 404);
    await prisma.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }

  return jsonError("Provide an id or all:true");
}
