import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CameraStreamType, Role } from "@prisma/client";
import { requireSession, jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

async function authorizeCamera(sessionUserId: string, sessionRole: Role, cameraId: string) {
  const camera = await prisma.cctvCamera.findUnique({
    where: { id: cameraId },
    include: { center: { select: { providerId: true } } },
  });
  if (!camera) return { error: jsonError("Camera not found", 404) as Response };
  if (
    sessionRole !== Role.ADMIN &&
    !(sessionRole === Role.PROVIDER && camera.center.providerId === sessionUserId)
  )
    return { error: jsonError("Forbidden", 403) as Response };
  return { camera };
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await authorizeCamera(auth.session.userId, auth.session.role, id);
  if ("error" in result) return result.error;

  const body = await req.json().catch(() => null);
  const { name, location, streamUrl, type, active } = body ?? {};

  if (type && !(type in CameraStreamType)) return jsonError("Invalid stream type");
  if (streamUrl && !/^https?:\/\//i.test(streamUrl.trim()))
    return jsonError("Stream URL must be an http(s) URL");

  const camera = await prisma.cctvCamera.update({
    where: { id: result.camera.id },
    data: {
      name: name?.trim() || undefined,
      location: typeof location === "string" ? location.trim() || null : undefined,
      streamUrl: streamUrl?.trim() || undefined,
      type: (type as CameraStreamType) || undefined,
      active: typeof active === "boolean" ? active : undefined,
    },
  });

  return NextResponse.json({ camera });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await authorizeCamera(auth.session.userId, auth.session.role, id);
  if ("error" in result) return result.error;

  await prisma.cctvCamera.delete({ where: { id: result.camera.id } });
  return NextResponse.json({ ok: true });
}
