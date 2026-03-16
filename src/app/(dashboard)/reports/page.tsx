"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";

interface ReportData {
  revenue: { month: string; amount: number; invoices: number }[];
  topMedicines: { name: string; qty: number }[];
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    totalPatients: number;
    totalPrescriptions: number;
    activePrograms: number;
  };
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return amount.toLocaleString("vi-VN");
}

function formatCurrencyFull(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"3m" | "6m" | "12m">("6m");
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsId, setSheetsId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function syncToSheets() {
    setSyncing(true);
    setSyncResult(null);
    try {
      // Extract spreadsheet ID from URL or use as-is
      let id = sheetsId.trim();
      const match = id.match(/\/spreadsheets\/d\/([\w-]+)/);
      if (match) id = match[1];

      const res = await fetch("/api/reports/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: id }),
      });
      const json = await res.json();
      if (res.ok) {
        setSyncResult({ ok: true, msg: `Đã đồng bộ ${json.rows} bệnh nhân lên Google Sheets.` });
      } else {
        setSyncResult({ ok: false, msg: json.error ?? "Lỗi không xác định" });
      }
    } catch {
      setSyncResult({ ok: false, msg: "Không thể kết nối server" });
    }
    setSyncing(false);
  }

  async function fetchReportData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📊</div>
          <div>Đang tải báo cáo...</div>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const revenueData = data?.revenue ?? [];
  const topMeds = data?.topMedicines ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động phòng khám</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { setShowSheetsModal(true); setSyncResult(null); }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            Google Sheets
          </button>
          {(["3m", "6m", "12m"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p === "3m" ? "3 tháng" : p === "6m" ? "6 tháng" : "12 tháng"}
            </button>
          ))}
        </div>
      </div>

      {/* Google Sheets Modal */}
      {showSheetsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ dữ liệu lên Google Sheets</h2>
              <p className="text-sm text-gray-500 mt-1">
                Xuất danh sách bệnh nhân (họ tên, tuổi, SĐT, chẩn đoán, hướng điều trị, ngày bắt đầu) vào Google Sheets.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Link hoặc ID Google Spreadsheet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetsId}
                onChange={e => setSheetsId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Dán link spreadsheet hoặc chỉ nhập ID. Sheet phải được chia sẻ cho service account.
              </p>
            </div>

            {syncResult && (
              <div className={`rounded-lg px-4 py-3 text-sm ${syncResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {syncResult.ok ? "✓ " : "✗ "}{syncResult.msg}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">Hướng dẫn thiết lập lần đầu:</p>
              <p>1. Tạo Google Cloud project → bật Sheets API</p>
              <p>2. Tạo Service Account → tải key JSON</p>
              <p>3. Điền <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> và <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> vào file <code className="bg-amber-100 px-1 rounded">.env</code></p>
              <p>4. Chia sẻ spreadsheet với email service account (quyền Editor)</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowSheetsModal(false); setSyncResult(null); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={syncToSheets}
                disabled={syncing || !sheetsId.trim()}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard icon="💰" label="Tổng doanh thu" value={formatCurrencyFull(summary?.totalRevenue ?? 0)} color="teal" />
        <SummaryCard icon="🧾" label="Tổng hóa đơn" value={(summary?.totalInvoices ?? 0).toLocaleString("vi-VN")} color="blue" />
        <SummaryCard icon="👥" label="Tổng bệnh nhân" value={(summary?.totalPatients ?? 0).toLocaleString("vi-VN")} color="purple" />
        <SummaryCard icon="💊" label="Đơn thuốc" value={(summary?.totalPrescriptions ?? 0).toLocaleString("vi-VN")} color="orange" />
        <SummaryCard icon="🌿" label="Gói 21 ngày" value={(summary?.activePrograms ?? 0).toLocaleString("vi-VN")} color="green" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Doanh thu theo tháng</h2>
        {revenueData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <div>Chưa có dữ liệu doanh thu</div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [formatCurrencyFull(Number(value ?? 0)), "Doanh thu"]}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Bar dataKey="amount" fill="#0d9488" radius={[4, 4, 0, 0]} name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Count Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Số lượng hóa đơn theo tháng</h2>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any) => [Number(v ?? 0), "Hóa đơn"]} />
                <Line type="monotone" dataKey="invoices" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} name="Hóa đơn" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Medicines */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Thuốc sử dụng nhiều nhất</h2>
          {topMeds.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu đơn thuốc</div>
          ) : (
            <div className="space-y-3">
              {topMeds.map((med, i) => (
                <div key={med.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700 truncate">{med.name}</span>
                      <span className="text-sm font-semibold text-gray-900 ml-2">{med.qty}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${Math.min(100, (med.qty / (topMeds[0]?.qty || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    teal: "bg-teal-50 border-teal-100",
    blue: "bg-blue-50 border-blue-100",
    purple: "bg-purple-50 border-purple-100",
    orange: "bg-orange-50 border-orange-100",
    green: "bg-green-50 border-green-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] ?? "bg-white border-gray-200"}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
