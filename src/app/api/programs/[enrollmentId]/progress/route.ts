import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createProgressSchema = z.object({
  weekNumber: z.number().min(1).max(3),
  completedTasks: z.record(z.string(), z.boolean()),
  complianceScore: z.number().min(0).max(100).optional(),
  symptoms: z.record(z.string(), z.unknown()).optional(),
  patientFeedback: z.string().optional(),
  consultantNotes: z.string().optional(),
  nextWeekGoals: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enrollmentId } = await params;
  const progress = await db.weeklyProgress.findMany({
    where: { enrollmentId },
    orderBy: { weekNumber: "asc" },
  });

  return NextResponse.json(progress);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enrollmentId } = await params;
  const body = await req.json();
  const parsed = createProgressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { weekNumber, completedTasks, complianceScore, symptoms, patientFeedback, consultantNotes, nextWeekGoals } = parsed.data;

  const data = {
    weekNumber,
    completedTasks: completedTasks as Prisma.InputJsonValue,
    complianceScore,
    symptoms: symptoms ? symptoms as Prisma.InputJsonValue : undefined,
    patientFeedback,
    consultantNotes,
    nextWeekGoals,
  };

  const progress = await db.weeklyProgress.upsert({
    where: {
      enrollmentId_weekNumber: {
        enrollmentId,
        weekNumber,
      },
    },
    create: {
      enrollmentId,
      ...data,
    },
    update: data,
  });

  return NextResponse.json(progress, { status: 201 });
}
