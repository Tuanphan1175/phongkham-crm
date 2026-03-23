import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prescription = await db.prescription.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, fullName: true, code: true, phone: true, dateOfBirth: true, gender: true } },
      doctor: { select: { name: true } },
      items: {
        include: {
          medicine: { select: { name: true, unit: true, concentration: true, dosageForm: true, sellPrice: true } },
        },
      },
    },
  });

  if (!prescription) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prescription);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!["PENDING", "DISPENSED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const px = await tx.prescription.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!px) throw new Error("Not found");
      if (px.status === "CANCELLED") throw new Error("Already cancelled");

      // Handle returning stock if cancelling a PENDING/DISPENSED order
      if (status === "CANCELLED") {
        for (const item of px.items) {
          await tx.medicine.update({
            where: { id: item.medicineId },
            data: { stockQty: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              medicineId: item.medicineId,
              type: "IN",
              quantity: item.quantity,
              reference: px.id,
              notes: `Hoàn trả thuốc từ đơn ${px.id}`,
            },
          });
        }
      }

      return tx.prescription.update({
        where: { id },
        data: { status },
      });
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
