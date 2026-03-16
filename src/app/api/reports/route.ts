import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "6m";
  const months = period === "3m" ? 3 : period === "12m" ? 12 : 6;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // Summary stats
  const [totalPatients, totalInvoices, totalPrescriptions, activePrograms, revenueAgg] =
    await Promise.all([
      db.patient.count(),
      db.invoice.count(),
      db.prescription.count(),
      db.programEnrollment.count({ where: { status: "ACTIVE" } }),
      db.invoice.aggregate({
        where: { status: "PAID" },
        _sum: { finalAmount: true },
      }),
    ]);

  // Revenue by month
  const paidInvoices = await db.invoice.findMany({
    where: { status: "PAID", paidAt: { gte: startDate } },
    select: { paidAt: true, finalAmount: true },
    orderBy: { paidAt: "asc" },
  });

  // Build monthly data
  const monthMap: Record<string, { amount: number; invoices: number }> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    monthMap[key] = { amount: 0, invoices: 0 };
  }

  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue;
    const d = new Date(inv.paidAt);
    const key = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    if (monthMap[key]) {
      monthMap[key].amount += Number(inv.finalAmount ?? 0);
      monthMap[key].invoices += 1;
    }
  }

  const revenue = Object.entries(monthMap).map(([month, v]) => ({
    month,
    amount: v.amount,
    invoices: v.invoices,
  }));

  // Top medicines from prescription items
  const prescriptionItems = await db.prescriptionItem.findMany({
    select: { medicineId: true, quantity: true, medicine: { select: { name: true } } },
  });

  const medMap: Record<string, { name: string; qty: number }> = {};
  for (const item of prescriptionItems) {
    if (!medMap[item.medicineId]) {
      medMap[item.medicineId] = { name: item.medicine.name, qty: 0 };
    }
    medMap[item.medicineId].qty += item.quantity;
  }

  const topMedicines = Object.values(medMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  return NextResponse.json({
    summary: {
      totalRevenue: Number(revenueAgg._sum.finalAmount ?? 0),
      totalInvoices,
      totalPatients,
      totalPrescriptions,
      activePrograms,
    },
    revenue,
    topMedicines,
  });
}
