import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  genericName: z.string().optional(),
  unit: z.string().min(1),
  dosageForm: z.string().optional(),
  concentration: z.string().optional(),
  manufacturer: z.string().optional(),
  stockQty: z.number().default(0),
  minStockQty: z.number().default(10),
  costPrice: z.number(),
  sellPrice: z.number(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";

  const where: Record<string, unknown> = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { genericName: { contains: search, mode: "insensitive" } },
    ];
  }

  const medicines = await db.medicine.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const result = lowStock
    ? medicines.filter((m) => m.stockQty <= m.minStockQty)
    : medicines;

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const medicine = await db.medicine.create({ data: parsed.data });
  return NextResponse.json(medicine, { status: 201 });
}
