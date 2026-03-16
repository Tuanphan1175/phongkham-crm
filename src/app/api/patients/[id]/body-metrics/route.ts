import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const metrics = await db.bodyMetric.findMany({
    where: { patientId: params.id },
    orderBy: { recordedAt: "desc" },
  });

  return NextResponse.json(metrics);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    recordedAt, height, weight, bmi, bodyFatPct, muscleMass,
    bodyShape, boneMass, visceralFat, bmr, metabolicAge,
    waterPct, waistCirc, bloodPressure, heartRate, notes,
  } = body;

  const num = (v: unknown) => (v !== undefined && v !== "" ? Number(v) : null);

  const metric = await db.bodyMetric.create({
    data: {
      patientId: params.id,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      height: num(height),
      weight: num(weight),
      bmi: num(bmi),
      bodyFatPct: num(bodyFatPct),
      muscleMass: num(muscleMass),
      bodyShape: num(bodyShape) !== null ? Math.round(num(bodyShape)!) : null,
      boneMass: num(boneMass),
      visceralFat: num(visceralFat),
      bmr: num(bmr),
      metabolicAge: num(metabolicAge) !== null ? Math.round(num(metabolicAge)!) : null,
      waterPct: num(waterPct),
      waistCirc: num(waistCirc),
      bloodPressure: bloodPressure || null,
      heartRate: num(heartRate) !== null ? Math.round(num(heartRate)!) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(metric, { status: 201 });
}
