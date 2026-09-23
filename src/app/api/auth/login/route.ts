import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { ApprovalStatus } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const { email, password } = body as { email?: string; password?: string };
  if (!email?.trim() || !password)
    return jsonError("Email and password are required");

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return jsonError("Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return jsonError("Invalid email or password", 401);

  if (user.approved === ApprovalStatus.REJECTED)
    return jsonError("Your account was rejected by an administrator", 403);

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
    },
  });
}
