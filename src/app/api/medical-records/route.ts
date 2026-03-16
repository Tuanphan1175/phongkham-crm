import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = patientId ? { patientId } : {};

  const [records, total] = await Promise.all([
    db.medicalRecord.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, code: true } },
        doctor: { select: { id: true, name: true } },
      },
      orderBy: { visitDate: "desc" },
      skip,
      take: limit,
    }),
    db.medicalRecord.count({ where }),
  ]);

  return NextResponse.json({ records, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    patientId, doctorId, visitDate,
    chiefComplaint, diagnosis, treatment,
    vitalSigns, labResults, imagingResults,
    notes, followUpDate,
  } = body;

  if (!patientId || !doctorId) {
    return NextResponse.json({ error: "Thiếu bệnh nhân hoặc bác sĩ" }, { status: 400 });
  }

  const record = await db.medicalRecord.create({
    data: {
      patientId,
      doctorId,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      chiefComplaint: chiefComplaint || null,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      vitalSigns: vitalSigns || null,
      labResults: labResults || null,
      imagingResults: imagingResults || null,
      notes: notes || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
    include: {
      patient: { select: { fullName: true, code: true } },
      doctor: { select: { name: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
