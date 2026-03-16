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

  const prescription = await db.prescription.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(prescription);
}
