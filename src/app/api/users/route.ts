import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const users = await db.user.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(role ? { role: role as never } : {}),
    },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, isActive: true, createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PHARMACIST"]),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, password, role, phone } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });

  const hashed = await hash(password, 12);
  const user = await db.user.create({
    data: { name, email, password: hashed, role, phone },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, isActive: true, createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
