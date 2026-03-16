import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const programs = await db.program.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { enrollments: true } },
      weekTemplates: { orderBy: { weekNumber: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Chỉ Admin mới có thể tạo gói" }, { status: 403 });
  }

  const body = await req.json();
  const { name, price, description } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "Thiếu tên hoặc giá gói" }, { status: 400 });
  }

  const count = await db.program.count();
  const program = await db.program.create({
    data: {
      code: `GOI_${String(count + 1).padStart(3, "0")}`,
      name,
      price: Number(price),
      description: description || null,
      durationWeeks: 3,
    },
  });

  return NextResponse.json(program, { status: 201 });
}
