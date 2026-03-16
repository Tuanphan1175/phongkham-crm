import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const includeInactive = searchParams.get("includeInactive") === "true";

  const services = await db.service.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, name, category, price, unit, description } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  const count = await db.service.count();
  const service = await db.service.create({
    data: {
      code: code || `SVC${String(count + 1).padStart(3, "0")}`,
      name,
      category: category || "Khám",
      price: Number(price),
      unit: unit || "lần",
      description,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
