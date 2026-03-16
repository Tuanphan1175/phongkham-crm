import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      items: { include: { service: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  return NextResponse.json(invoice);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { paidAmount, paymentMethod, status } = body;

  const invoice = await db.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const newPaidAmount = paidAmount ?? Number(invoice.paidAmount);
  const finalAmount = Number(invoice.finalAmount);

  let newStatus = status;
  if (!newStatus) {
    if (newPaidAmount >= finalAmount) newStatus = "PAID";
    else if (newPaidAmount > 0) newStatus = "PARTIAL";
    else newStatus = "UNPAID";
  }

  const updated = await db.invoice.update({
    where: { id: params.id },
    data: {
      paidAmount: newPaidAmount,
      paymentMethod,
      status: newStatus,
      paidAt: newStatus === "PAID" ? new Date() : undefined,
    },
  });

  return NextResponse.json(updated);
}
