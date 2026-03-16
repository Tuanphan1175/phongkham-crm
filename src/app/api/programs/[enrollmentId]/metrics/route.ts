import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const metricSchema = z.object({
  weekNumber: z.number().min(0).max(3),
  weight: z.number().optional(),
  bmi: z.number().optional(),
  waistCirc: z.number().optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  digestiveScore: z.number().min(1).max(10).optional(),
  sleepQuality: z.number().min(1).max(10).optional(),
  bloating: z.boolean().optional(),
  constipation: z.boolean().optional(),
  diarrhea: z.boolean().optional(),
  heartburn: z.boolean().optional(),
  stoolQuality: z.number().min(1).max(7).optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const metrics = await db.healthMetric.findMany({
    where: { enrollmentId: params.enrollmentId },
    orderBy: { weekNumber: "asc" },
  });

  return NextResponse.json(metrics);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = metricSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const metric = await db.healthMetric.create({
    data: {
      enrollmentId: params.enrollmentId,
      ...parsed.data,
    },
  });

  return NextResponse.json(metric, { status: 201 });
}
