import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string(),
  programId: z.string(),
  startDate: z.string(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const patientId = searchParams.get("patientId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;

  const [enrollments, total] = await Promise.all([
    db.programEnrollment.findMany({
      where,
      include: {
        patient: { select: { fullName: true, code: true, phone: true } },
        program: { select: { name: true, durationWeeks: true } },
        weeklyProgress: { select: { weekNumber: true, complianceScore: true } },
        healthMetrics: { select: { weekNumber: true, weight: true, digestiveScore: true } },
      },
      orderBy: { startDate: "desc" },
      skip,
      take: limit,
    }),
    db.programEnrollment.count({ where }),
  ]);

  return NextResponse.json({ enrollments, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { patientId, programId, startDate, assignedTo, notes } = parsed.data;

  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 21);

  const enrollment = await db.programEnrollment.create({
    data: {
      patientId,
      programId,
      startDate: start,
      endDate: end,
      assignedTo,
      notes,
    },
    include: {
      patient: true,
      program: true,
    },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
