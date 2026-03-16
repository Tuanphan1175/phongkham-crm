import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { z } from "zod";

const invoiceItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number(),
});

const createInvoiceSchema = z.object({
  patientId: z.string(),
  items: z.array(invoiceItemSchema).min(1),
  discountAmount: z.number().default(0),
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

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { patient: true, items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { patientId, items, discountAmount, notes } = parsed.data;

  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const count = await db.invoice.count();
  const invoiceNumber = generateInvoiceNumber(count + 1);

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      patientId,
      totalAmount,
      discountAmount,
      finalAmount,
      notes,
      items: {
        create: items.map((item) => ({
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
      },
    },
    include: { patient: true, items: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
