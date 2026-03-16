import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, price, description, isActive } = body;

  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    return NextResponse.json({ error: "Giá không hợp lệ" }, { status: 400 });
  }

  const program = await db.program.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(program);
}
