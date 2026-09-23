import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";
import type { Role } from "@prisma/client";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession(): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError("Unauthorized", 401) };
  return { ok: true, session };
}

export async function requireRole(...roles: Role[]): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError("Unauthorized", 401) };
  if (!roles.includes(session.role))
    return { ok: false, response: jsonError("Forbidden", 403) };
  return { ok: true, session };
}
