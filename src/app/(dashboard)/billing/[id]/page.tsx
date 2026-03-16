"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  service: { name: string } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  patient: {
    id: string;
    fullName: string;
    code: string;
    phone: string | null;
    insurance: string | null;
  };
  items: InvoiceItem[];
}

const STATUS_COLORS: Record<string, string> = {
  UNPAID:    "bg-red-100 text-red-700 border border-red-200",
  PARTIAL:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
  PAID:      "bg-green-100 text-green-700 border border-green-200",
  REFUNDED:  "bg-blue-100 text-blue-700 border border-blue-200",
  CANCELLED: "bg-gray-100 text-gray-500 border border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  UNPAID: "Chưa thanh toán", PARTIAL: "Thanh toán một phần",
  PAID: "Đã thanh toán", REFUNDED: "Đã hoàn tiền", CANCELLED: "Đã hủy",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Tiền mặt", MOMO: "MoMo", VNPAY: "VNPay",
  BANK_TRANSFER: "Chuyển khoản", INSURANCE: "Bảo hiểm y tế",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BillingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payForm, setPayForm] = useState({ paidAmount: "", paymentMethod: "CASH", paymentRef: "" });
  const [showPayForm, setShowPayForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/billing/${id}`);
    if (res.ok) setInvoice(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setPaying(true);
    const res = await fetch(`/api/billing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paidAmount: Number(payForm.paidAmount),
        paymentMethod: payForm.paymentMethod,
        ...(payForm.paymentRef && { paymentRef: payForm.paymentRef }),
      }),
    });
    if (res.ok) {
      setShowPayForm(false);
      await load();
    } else {
      alert("Lỗi cập nhật thanh toán");
    }
    setPaying(false);
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Đang tải...</div>;
  if (!invoice) return <div className="py-16 text-center text-gray-400">Không tìm thấy hóa đơn</div>;

  const remaining = invoice.finalAmount - invoice.paidAmount;
  const isSettled = ["PAID", "CANCELLED", "REFUNDED"].includes(invoice.status);

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/billing" className="text-sm text-gray-400 hover:text-gray-600">← Thanh toán</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Chi tiết hóa đơn</h1>
          <p className="text-sm text-gray-400 font-mono">{invoice.invoiceNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
          <Link
            href={`/print/invoice/${invoice.id}`}
            target="_blank"
            className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
          >
            🖨️ In
          </Link>
        </div>
      </div>

      {/* Patient + Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bệnh nhân</h2>
          <p className="font-semibold text-gray-900">{invoice.patient.fullName}</p>
          <p className="text-sm text-gray-500 font-mono">{invoice.patient.code}</p>
          {invoice.patient.phone && <p className="text-sm text-gray-500 mt-1">📞 {invoice.patient.phone}</p>}
          {invoice.patient.insurance && <p className="text-sm text-gray-500">🏥 BHYT: {invoice.patient.insurance}</p>}
          <Link href={`/patients/${invoice.patient.id}`} className="text-xs text-teal-600 hover:underline mt-2 inline-block">
            Xem hồ sơ →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Thông tin</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-400">Ngày tạo:</span> <span className="text-gray-800">{formatDate(invoice.createdAt)}</span></div>
            {invoice.paidAt && <div><span className="text-gray-400">Ngày TT:</span> <span className="text-gray-800">{formatDate(invoice.paidAt)}</span></div>}
            {invoice.paymentMethod && (
              <div><span className="text-gray-400">Hình thức:</span> <span className="text-gray-800">{PAYMENT_LABELS[invoice.paymentMethod] ?? invoice.paymentMethod}</span></div>
            )}
            {invoice.paymentRef && (
              <div><span className="text-gray-400">Mã GD:</span> <span className="font-mono text-gray-700">{invoice.paymentRef}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Dịch vụ ({invoice.items.length})</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Tên dịch vụ</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 w-16">SL</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 w-32">Đơn giá</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500 w-32">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tổng cộng</span><span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Giảm giá</span><span>- {formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100">
            <span>Thành tiền</span><span className="text-teal-700">{formatCurrency(invoice.finalAmount)}</span>
          </div>
          {invoice.paidAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Đã thanh toán</span><span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
          )}
          {remaining > 0 && (
            <div className="flex justify-between text-sm font-semibold text-red-600">
              <span>Còn lại</span><span>{formatCurrency(remaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Ghi chú</p>
          <p className="text-sm text-amber-700">{invoice.notes}</p>
        </div>
      )}

      {/* Payment form */}
      {!isSettled && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Thu tiền</h2>
            {!showPayForm && (
              <button
                onClick={() => { setShowPayForm(true); setPayForm(f => ({ ...f, paidAmount: String(remaining) })); }}
                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                + Ghi nhận thanh toán
              </button>
            )}
          </div>
          {showPayForm && (
            <form onSubmit={handlePay} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Số tiền thu (VND)</label>
                  <input
                    type="number" min="0" required
                    value={payForm.paidAmount}
                    onChange={e => setPayForm(f => ({ ...f, paidAmount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hình thức thanh toán</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="CASH">Tiền mặt</option>
                    <option value="MOMO">MoMo</option>
                    <option value="VNPAY">VNPay</option>
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="INSURANCE">Bảo hiểm y tế</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mã giao dịch (nếu có)</label>
                <input
                  type="text" placeholder="TXN123..."
                  value={payForm.paymentRef}
                  onChange={e => setPayForm(f => ({ ...f, paymentRef: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={paying}
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                  {paying ? "Đang lưu..." : "Xác nhận thanh toán"}
                </button>
                <button type="button" onClick={() => setShowPayForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/billing/new?patientId=${invoice.patient.id}`}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
          + Hóa đơn mới
        </Link>
        <Link href={`/patients/${invoice.patient.id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Hồ sơ bệnh nhân
        </Link>
      </div>
    </div>
  );
}
