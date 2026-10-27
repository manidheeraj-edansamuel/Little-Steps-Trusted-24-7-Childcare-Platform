import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parentHasActiveCare } from "@/lib/access";
import { CameraStreamType, Role } from "@prisma/client";
import { requireSession, jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id: centerId } = await params;
  const center = await prisma.daycareCenter.findUnique({
    where: { id: centerId },
    select: { id: true, name: true, providerId: true },
  });
  if (!center) return jsonError("Center not found", 404);

  const { role, userId } = auth.session;
  if (role === Role.PARENT) {
    const allowed = await parentHasActiveCare(userId, center.id);
    if (!allowed)
      return jsonError(
        "Live feeds are available only for centers you are currently enrolled in.",
        403
      );
  } else if (role === Role.PROVIDER && center.providerId !== userId) {
    return jsonError("Forbidden", 403);
  }

  const cameras = await prisma.cctvCamera.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ center, cameras });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id: centerId } = await params;
  const center = await prisma.daycareCenter.findUnique({
    where: { id: centerId },
    select: { id: true, providerId: true },
  });
  if (!center) return jsonError("Center not found", 404);

  if (
    auth.session.role !== Role.ADMIN &&
    !(auth.session.role === Role.PROVIDER && center.providerId === auth.session.userId)
  )
    return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const { name, location, streamUrl, type } = body ?? {};

  if (!name?.trim()) return jsonError("Camera name is required");
  if (!streamUrl?.trim()) return jsonError("Stream URL is required");
  if (!/^https?:\/\//i.test(streamUrl.trim()))
    return jsonError("Stream URL must be an http(s) URL");
  if (type && !(type in CameraStreamType)) return jsonError("Invalid stream type");

  const camera = await prisma.cctvCamera.create({
    data: {
      name: name.trim(),
      location: location?.trim() || null,
      streamUrl: streamUrl.trim(),
      type: (type as CameraStreamType) ?? CameraStreamType.HLS,
      centerId: center.id,
    },
  });

  return NextResponse.json({ camera }, { status: 201 });
}
