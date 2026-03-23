import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const itemSchema = z.object({
  medicineId: z.string(),
  quantity: z.number().min(1),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional(),
});

const createSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  const [prescriptions, total] = await Promise.all([
    db.prescription.findMany({
      where,
      include: {
        patient: { select: { fullName: true, code: true } },
        doctor: { select: { name: true } },
        items: { include: { medicine: { select: { name: true, unit: true } } } },
      },
      orderBy: { issuedAt: "desc" },
      skip,
      take: limit,
    }),
    db.prescription.count({ where }),
  ]);

  return NextResponse.json({ prescriptions, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { patientId, doctorId, diagnosis, notes, items } = parsed.data;

  try {
    // Create prescription + deduct stock in a transaction
    const prescription = await db.$transaction(async (tx) => {
      const px = await tx.prescription.create({
        data: {
          patientId,
          doctorId,
          diagnosis,
          notes,
          status: "PENDING",
          items: { create: items },
        },
        include: {
          items: { include: { medicine: true } },
          patient: true,
          doctor: true,
        },
      });

      // Deduct stock for each medicine
      for (const item of items) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { stockQty: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            medicineId: item.medicineId,
            type: "OUT",
            quantity: -item.quantity,
            reference: px.id,
            notes: `Đơn thuốc BN ${patientId}`,
          },
        });
      }

      return px;
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (err: unknown) {
    console.error("Prescription creation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
