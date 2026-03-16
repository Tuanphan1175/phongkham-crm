"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Doctor { id: string; name: string }
interface Patient { id: string; fullName: string; code: string; phone: string | null }

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prePatientId = searchParams.get("patientId") ?? "";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users?role=DOCTOR")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(() => {});

    if (prePatientId) {
      fetch(`/api/patients/${prePatientId}`)
        .then((r) => r.json())
        .then(setSelectedPatient)
        .catch(() => {});
    }
  }, [prePatientId]);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/patients?search=${patientSearch}&limit=5`)
        .then((r) => r.json())
        .then((d) => setPatients(d.patients ?? []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPatient) { setError("Vui lòng chọn bệnh nhân"); return; }
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      patientId: selectedPatient.id,
      doctorId: form.get("doctorId"),
      scheduledAt: `${form.get("date")}T${form.get("time")}:00`,
      duration: parseInt(form.get("duration") as string),
      type: form.get("type"),
      notes: form.get("notes"),
    };

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/appointments");
    } else {
      setError("Không thể tạo lịch hẹn");
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Đặt lịch hẹn</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Patient search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bệnh nhân <span className="text-red-500">*</span>
          </label>
          {selectedPatient ? (
            <div className="flex items-center justify-between px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedPatient.fullName}</p>
                <p className="text-xs text-gray-500">{selectedPatient.code} · {selectedPatient.phone ?? "—"}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Đổi
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Tìm theo tên, mã BN, SĐT..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {patients.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(""); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm font-medium">{p.fullName}</p>
                      <p className="text-xs text-gray-400">{p.code} · {p.phone ?? "—"}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bác sĩ <span className="text-red-500">*</span>
          </label>
          <select
            name="doctorId"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Chọn bác sĩ</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày <span className="text-red-500">*</span>
            </label>
            <input
              name="date"
              type="date"
              defaultValue={today}
              min={today}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giờ <span className="text-red-500">*</span>
            </label>
            <input
              name="time"
              type="time"
              defaultValue="08:00"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Type & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại khám</label>
            <select
              name="type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Khám mới">Khám mới</option>
              <option value="Tái khám">Tái khám</option>
              <option value="Gói liệu trình">Gói liệu trình</option>
              <option value="Tư vấn">Tư vấn</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút)</label>
            <select
              name="duration"
              defaultValue="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="45">45 phút</option>
              <option value="60">60 phút</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea
            name="notes"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Lý do khám, yêu cầu đặc biệt..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Đang lưu..." : "Đặt lịch"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
