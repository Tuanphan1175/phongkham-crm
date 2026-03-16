import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const body = await req.json();
  const { name, genericName, sellPrice, costPrice, unit, dosageForm, minStockQty, isActive } = body;

  const medicine = await db.medicine.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(genericName !== undefined && { genericName }),
      ...(sellPrice !== undefined && { sellPrice: Number(sellPrice) }),
      ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
      ...(unit !== undefined && { unit }),
      ...(dosageForm !== undefined && { dosageForm }),
      ...(minStockQty !== undefined && { minStockQty: Number(minStockQty) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(medicine);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  await db.medicine.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
