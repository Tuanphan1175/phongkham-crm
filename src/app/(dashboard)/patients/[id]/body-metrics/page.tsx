"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface BodyMetric {
  id: string;
  recordedAt: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bodyFatPct: number | null;
  muscleMass: number | null;
  bodyShape: number | null;
  boneMass: number | null;
  visceralFat: number | null;
  bmr: number | null;
  metabolicAge: number | null;
  waterPct: number | null;
  waistCirc: number | null;
  bloodPressure: string | null;
  heartRate: number | null;
  notes: string | null;
}

interface Patient {
  id: string;
  fullName: string;
  code: string;
  gender: string | null;
}

const METRICS = [
  { key: "weight",       label: "Cân nặng",          unit: "kg",  ref: "" },
  { key: "bmi",          label: "BMI",                unit: "",    ref: "18–22.9" },
  { key: "bodyFatPct",   label: "Mỡ cơ thể",         unit: "%",   ref: "Nữ: 18–28% | Nam: 10–20%" },
  { key: "muscleMass",   label: "Khối cơ",            unit: "kg",  ref: "" },
  { key: "bodyShape",    label: "Vóc dáng cơ thể",   unit: "",    ref: "1–3: Béo | 4–6: TB | 7–9: Gầy" },
  { key: "boneMass",     label: "Khối xương",         unit: "kg",  ref: "Nữ: 1.8–2.5 | Nam: 2.5–3.2" },
  { key: "visceralFat",  label: "Mỡ nội tạng",       unit: "",    ref: "Nam <5 | Nữ <6" },
  { key: "bmr",          label: "BMR",                unit: "kcal",ref: "" },
  { key: "metabolicAge", label: "Tuổi sinh học",      unit: "tuổi",ref: "" },
  { key: "waterPct",     label: "Tỉ lệ nước cơ thể", unit: "%",   ref: "Nam: 50–65% | Nữ: 45–60%" },
  { key: "waistCirc",    label: "Vòng bụng",          unit: "cm",  ref: "" },
  { key: "bloodPressure",label: "Huyết áp",           unit: "",    ref: "120/80" },
  { key: "heartRate",    label: "Nhịp tim",           unit: "bpm", ref: "60–100" },
];

const EMPTY_FORM = {
  recordedAt: new Date().toISOString().slice(0, 10),
  height: "", weight: "", bmi: "", bodyFatPct: "", muscleMass: "",
  bodyShape: "", boneMass: "", visceralFat: "", bmr: "", metabolicAge: "",
  waterPct: "", waistCirc: "", bloodPressure: "", heartRate: "", notes: "",
};

function fmt(v: number | null | string, unit = "") {
  if (v === null || v === undefined) return "—";
  return `${v}${unit ? " " + unit : ""}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function BodyMetricsPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [pRes, mRes] = await Promise.all([
      fetch(`/api/patients/${patientId}`),
      fetch(`/api/patients/${patientId}/body-metrics`),
    ]);
    if (pRes.ok) setPatient(await pRes.json());
    if (mRes.ok) setMetrics(await mRes.json());
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  // Auto-calc BMI when weight/height changes
  useEffect(() => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    if (w > 0 && h > 0) {
      const bmi = (w / ((h / 100) ** 2)).toFixed(1);
      setForm(f => ({ ...f, bmi }));
    }
  }, [form.weight, form.height]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/patients/${patientId}/body-metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Lỗi lưu dữ liệu");
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  }

  const latest = metrics[0];

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/patients/${patientId}`} className="text-sm text-gray-400 hover:text-gray-600">
            ← {patient?.fullName ?? "Bệnh nhân"}
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Bảng theo dõi chỉ số cơ thể</h1>
          {patient && (
            <p className="text-sm text-gray-500 font-mono">{patient.code}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          {showForm ? "Huỷ" : "+ Nhập chỉ số mới"}
        </button>
      </div>

      {/* Input form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nhập chỉ số mới</h2>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ngày đo</label>
                <input
                  type="date"
                  value={form.recordedAt}
                  onChange={e => setForm(f => ({ ...f, recordedAt: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Chiều cao (cm)</label>
                <input
                  type="number" step="0.1" min="50" max="250"
                  value={form.height}
                  onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                  placeholder="170"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {METRICS.map((m) => (
                <div key={m.key}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {m.label}{m.unit ? ` (${m.unit})` : ""}
                    {m.ref && <span className="text-gray-400 ml-1 text-[10px]">Ref: {m.ref}</span>}
                  </label>
                  <input
                    type={m.key === "bloodPressure" || m.key === "notes" ? "text" : "number"}
                    step={["bmi","bodyFatPct","muscleMass","boneMass","visceralFat","bmr","waterPct","waistCirc","weight"].includes(m.key) ? "0.1" : "1"}
                    value={(form as Record<string, string>)[m.key]}
                    onChange={e => setForm(f => ({ ...f, [m.key]: e.target.value }))}
                    placeholder={m.key === "bloodPressure" ? "120/80" : ""}
                    readOnly={m.key === "bmi"}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${m.key === "bmi" ? "bg-gray-50 text-gray-500" : ""}`}
                  />
                </div>
              ))}
              <div className="col-span-2 md:col-span-4">
                <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Huỷ
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                {saving ? "Đang lưu..." : "Lưu chỉ số"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comparison table - all sessions side by side */}
      {metrics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Bảng theo dõi tổng hợp</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{metrics.length} lần đo</span>
              <a
                href={`/print/body-metrics/${patientId}`}
                target="_blank"
                className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900"
              >
                🖨️ In bảng
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 w-44 sticky left-0 bg-teal-50">
                    Chỉ số
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">
                    Tham chiếu (REF)
                  </th>
                  {metrics.map((m, i) => (
                    <th key={m.id} className="text-center px-4 py-3 text-xs font-semibold text-gray-700 min-w-28">
                      <div>{i === 0 ? "BẮT ĐẦU" : `LẦN ${i + 1}`}</div>
                      <div className="text-gray-400 font-normal">{formatDate(m.recordedAt)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Height row */}
                <tr className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700 font-medium sticky left-0 bg-white">
                    Chiều cao
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs"></td>
                  {metrics.map((m) => (
                    <td key={m.id} className="px-4 py-2.5 text-center text-gray-900">
                      {m.height ? `${m.height} cm` : "—"}
                    </td>
                  ))}
                </tr>
                {METRICS.map((metric) => (
                  <tr key={metric.key} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700 font-medium sticky left-0 bg-white">
                      {metric.label}{metric.unit ? ` (${metric.unit})` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs leading-tight">
                      {metric.ref}
                    </td>
                    {metrics.map((m, idx) => {
                      const val = (m as unknown as Record<string, unknown>)[metric.key];
                      const prevVal = idx < metrics.length - 1
                        ? (metrics[idx + 1] as unknown as Record<string, unknown>)[metric.key]
                        : null;
                      const numVal = typeof val === "number" ? val : null;
                      const numPrev = typeof prevVal === "number" ? prevVal : null;
                      const diff = numVal !== null && numPrev !== null ? numVal - numPrev : null;
                      const isUp = diff !== null && diff > 0;
                      const isDown = diff !== null && diff < 0;
                      return (
                        <td key={m.id} className="px-4 py-2.5 text-center">
                          <div className="text-gray-900">
                            {val === null || val === undefined
                              ? "—"
                              : typeof val === "string"
                              ? val
                              : typeof val === "number"
                              ? (Number.isInteger(val) ? val : val.toFixed(1))
                              : "—"}
                          </div>
                          {diff !== null && idx > 0 && (
                            <div className={`text-[10px] font-medium ${isUp ? "text-red-500" : isDown ? "text-green-600" : "text-gray-400"}`}>
                              {isUp ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Notes row */}
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 text-xs italic sticky left-0 bg-gray-50">
                    Ghi chú
                  </td>
                  <td className="px-4 py-2.5"></td>
                  {metrics.map((m) => (
                    <td key={m.id} className="px-4 py-2.5 text-center text-xs text-gray-500 italic">
                      {m.notes ?? ""}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Latest metrics summary cards */}
      {latest && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Chỉ số mới nhất — {formatDate(latest.recordedAt)}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Cân nặng", value: fmt(latest.weight, "kg") },
              { label: "BMI", value: fmt(latest.bmi) },
              { label: "Mỡ cơ thể", value: fmt(latest.bodyFatPct, "%") },
              { label: "Khối cơ", value: fmt(latest.muscleMass, "kg") },
              { label: "Mỡ nội tạng", value: fmt(latest.visceralFat) },
              { label: "Tỉ lệ nước", value: fmt(latest.waterPct, "%") },
              { label: "Huyết áp", value: fmt(latest.bloodPressure) },
              { label: "Nhịp tim", value: fmt(latest.heartRate, "bpm") },
              { label: "Tuổi sinh học", value: fmt(latest.metabolicAge) },
              { label: "BMR", value: fmt(latest.bmr, "kcal") },
              { label: "Khối xương", value: fmt(latest.boneMass, "kg") },
              { label: "Vòng bụng", value: fmt(latest.waistCirc, "cm") },
              { label: "Vóc dáng", value: latest.bodyShape ? `${latest.bodyShape} (${latest.bodyShape <= 3 ? "Béo" : latest.bodyShape <= 6 ? "Trung bình" : "Gầy"})` : "—" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500 text-sm">Chưa có chỉ số nào được ghi nhận</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            Nhập chỉ số đầu tiên
          </button>
        </div>
      )}
    </div>
  );
}
