"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HealthMetric {
  id: string;
  weekNumber: number;
  weight: number | null;
  bmi: number | null;
  energyLevel: number | null;
  digestiveScore: number | null;
  sleepQuality: number | null;
  bloating: boolean | null;
  constipation: boolean | null;
  notes: string | null;
}

interface Props {
  enrollmentId: string;
  metrics: HealthMetric[];
  baselineMetric: HealthMetric | null;
  currentWeek: number;
  status: string;
}

export default function HealthMetricsSection({ enrollmentId, metrics, baselineMetric, currentWeek, status }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weekNumber: currentWeek,
    weight: "",
    energyLevel: "",
    digestiveScore: "",
    sleepQuality: "",
    bloating: false,
    constipation: false,
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      weekNumber: formData.weekNumber,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      energyLevel: formData.energyLevel ? parseInt(formData.energyLevel) : undefined,
      digestiveScore: formData.digestiveScore ? parseInt(formData.digestiveScore) : undefined,
      sleepQuality: formData.sleepQuality ? parseInt(formData.sleepQuality) : undefined,
      bloating: formData.bloating,
      constipation: formData.constipation,
      notes: formData.notes || undefined,
    };

    const res = await fetch(`/api/programs/${enrollmentId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      router.refresh();
    } else {
      alert("Lỗi khi lưu chỉ số");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Chỉ số sức khoẻ</h3>
        {status === "ACTIVE" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            + Nhập chỉ số
          </button>
        )}
      </div>

      {/* Metrics table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-2 text-xs text-gray-400 font-medium">Chỉ số</th>
              <th className="text-center pb-2 text-xs text-gray-400 font-medium">Đầu vào</th>
              {[1, 2, 3].map((w) => (
                <th key={w} className="text-center pb-2 text-xs text-gray-400 font-medium">Tuần {w}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { key: "weight", label: "Cân nặng (kg)", suffix: "kg" },
              { key: "energyLevel", label: "Năng lượng (1-10)", suffix: "/10" },
              { key: "digestiveScore", label: "Tiêu hóa (1-10)", suffix: "/10" },
              { key: "sleepQuality", label: "Giấc ngủ (1-10)", suffix: "/10" },
            ].map(({ key, label, suffix }) => (
              <tr key={key}>
                <td className="py-2 text-xs text-gray-600">{label}</td>
                <td className="py-2 text-center text-xs font-medium text-gray-700">
                  {baselineMetric?.[key as keyof HealthMetric] != null
                    ? `${baselineMetric[key as keyof HealthMetric]}${suffix}`
                    : "—"}
                </td>
                {[1, 2, 3].map((w) => {
                  const m = metrics.find((mx) => mx.weekNumber === w);
                  const val = m?.[key as keyof HealthMetric];
                  return (
                    <td key={w} className="py-2 text-center text-xs font-medium text-gray-700">
                      {val != null ? `${val}${suffix}` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Symptoms */}
            {[
              { key: "bloating", label: "Đầy hơi" },
              { key: "constipation", label: "Táo bón" },
            ].map(({ key, label }) => (
              <tr key={key}>
                <td className="py-2 text-xs text-gray-600">{label}</td>
                <td className="py-2 text-center text-xs">
                  {baselineMetric?.[key as keyof HealthMetric] != null
                    ? (baselineMetric[key as keyof HealthMetric] ? "🔴" : "🟢")
                    : "—"}
                </td>
                {[1, 2, 3].map((w) => {
                  const m = metrics.find((mx) => mx.weekNumber === w);
                  const val = m?.[key as keyof HealthMetric];
                  return (
                    <td key={w} className="py-2 text-center text-xs">
                      {val != null ? (val ? "🔴" : "🟢") : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-3">
          <p className="font-medium text-sm text-gray-800">Nhập chỉ số sức khoẻ</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tuần</label>
              <select
                value={formData.weekNumber}
                onChange={(e) => setFormData((p) => ({ ...p, weekNumber: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Đầu vào (baseline)</option>
                <option value={1}>Cuối tuần 1</option>
                <option value={2}>Cuối tuần 2</option>
                <option value={3}>Cuối tuần 3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cân nặng (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="65.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "energyLevel", label: "Năng lượng (1-10)" },
              { key: "digestiveScore", label: "Tiêu hóa (1-10)" },
              { key: "sleepQuality", label: "Giấc ngủ (1-10)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData[key as keyof typeof formData] as string}
                  onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.bloating}
                onChange={(e) => setFormData((p) => ({ ...p, bloating: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Đầy hơi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constipation}
                onChange={(e) => setFormData((p) => ({ ...p, constipation: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Táo bón</span>
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Đang lưu..." : "Lưu chỉ số"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
