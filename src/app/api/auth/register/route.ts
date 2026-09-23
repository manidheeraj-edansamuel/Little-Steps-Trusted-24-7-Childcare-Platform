import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { Role, ApprovalStatus } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  const { name, email, password, phone, role } = body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role?: string;
  };

  if (!name?.trim() || !email?.trim() || !password)
    return jsonError("Name, email and password are required");
  if (password.length < 6)
    return jsonError("Password must be at least 6 characters");

  const selectedRole =
    role === Role.PROVIDER ? Role.PROVIDER : Role.PARENT;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) return jsonError("An account with that email already exists", 409);

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone: phone?.trim() || null,
      role: selectedRole,
      // Parents can start booking right away; providers wait for admin verification.
      approved:
        selectedRole === Role.PROVIDER
          ? ApprovalStatus.PENDING
          : ApprovalStatus.APPROVED,
    },
  });

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
      },
    },
    { status: 201 }
  );
}
