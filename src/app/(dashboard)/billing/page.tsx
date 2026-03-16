import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate, formatCurrency, INVOICE_STATUS_LABELS } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

const STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  REFUNDED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

async function getInvoices(status: string, page: number) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const where = status && status !== "ALL" ? { status: status as InvoiceStatus } : {};

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.invoice.count({ where }),
  ]);

  return { invoices, total };
}

async function getSummary() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const [paid, unpaid] = await Promise.all([
    db.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: start } },
      _sum: { finalAmount: true },
      _count: true,
    }),
    db.invoice.count({ where: { status: "UNPAID" } }),
  ]);
  return { monthRevenue: Number(paid._sum.finalAmount ?? 0), paidCount: paid._count, unpaidCount: unpaid };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = statusParam ?? "ALL";
  const page = parseInt(pageParam ?? "1");
  const [{ invoices, total }, summary] = await Promise.all([
    getInvoices(status, page),
    getSummary(),
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Thanh toán & Hóa đơn</h1>
        <Link
          href="/billing/new"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          + Tạo hóa đơn
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-600 uppercase font-medium">Doanh thu tháng này</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.monthRevenue)}</p>
          <p className="text-xs text-gray-400">{summary.paidCount} hóa đơn đã thanh toán</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs text-red-600 uppercase font-medium">Chưa thanh toán</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.unpaidCount}</p>
          <p className="text-xs text-gray-400">hóa đơn đang chờ</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 uppercase font-medium">Tổng hóa đơn</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
          <p className="text-xs text-gray-400">tất cả trạng thái</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(["ALL", "UNPAID", "PARTIAL", "PAID"] as const).map((s) => (
          <Link
            key={s}
            href={`/billing?status=${s}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === s
                ? "bg-teal-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s === "ALL" ? "Tất cả" : INVOICE_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Số HĐ</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bệnh nhân</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Đã thu</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">Không có hóa đơn</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{inv.patient.fullName}</p>
                    <p className="text-xs text-gray-400">{inv.patient.code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(inv.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(Number(inv.finalAmount))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(Number(inv.paidAmount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/billing/${inv.id}`} className="text-sm text-teal-600 hover:underline">
                        Chi tiết
                      </Link>
                      <Link
                        href={`/print/invoice/${inv.id}`}
                        target="_blank"
                        className="text-sm text-gray-500 hover:text-gray-800"
                      >
                        🖨️
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
