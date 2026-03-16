import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updatePatientSchema = z.object({
  fullName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  occupation: z.string().optional(),
  insurance: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await db.patient.findUnique({
    where: { id: params.id },
    include: {
      appointments: {
        include: { doctor: true },
        orderBy: { scheduledAt: "desc" },
        take: 10,
      },
      medicalRecords: {
        include: { doctor: true },
        orderBy: { visitDate: "desc" },
        take: 5,
      },
      prescriptions: {
        include: { items: { include: { medicine: true } } },
        orderBy: { issuedAt: "desc" },
        take: 5,
      },
      programEnrollments: {
        include: { program: true },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Không tìm thấy bệnh nhân" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updatePatientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patient = await db.patient.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : undefined,
      email: parsed.data.email || undefined,
    },
  });

  return NextResponse.json(patient);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  await db.patient.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
