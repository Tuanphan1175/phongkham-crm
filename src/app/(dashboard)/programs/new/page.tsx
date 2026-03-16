"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Patient { id: string; code: string; fullName: string; phone?: string; }
interface Program { id: string; name: string; durationWeeks: number; price: number; description?: string; }

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function NewEnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const [programs, setPrograms] = useState<Program[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientList, setShowPatientList] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Load programs
  useEffect(() => {
    fetch("/api/programs")
      .then(r => r.json())
      .then(data => {
        setPrograms(data);
        if (data.length > 0) setSelectedProgram(data[0]);
      })
      .catch(() => {});
  }, []);

  // Load preselected patient
  useEffect(() => {
    if (!preselectedPatientId) return;
    fetch(`/api/patients/${preselectedPatientId}`)
      .then(r => r.json())
      .then(data => {
        if (data?.id) setSelectedPatient(data);
      })
      .catch(() => {});
  }, [preselectedPatientId]);

  // Patient search
  useEffect(() => {
    if (!patientSearch.trim()) { setPatients([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&limit=8`)
        .then(r => r.json())
        .then(d => setPatients(d.patients ?? d))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Calculate end date
  const endDate = (() => {
    if (!startDate || !selectedProgram) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + (selectedProgram.durationWeeks * 7));
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) { alert("Vui lòng chọn bệnh nhân!"); return; }
    if (!selectedProgram) { alert("Vui lòng chọn gói liệu trình!"); return; }

    setSaving(true);
    const res = await fetch("/api/programs/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        programId: selectedProgram.id,
        startDate,
        assignedTo: assignedTo.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });

    if (res.ok) {
      const enrollment = await res.json();
      router.push(`/programs/${enrollment.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      alert("Lỗi đăng ký gói: " + (err?.error ?? "Vui lòng thử lại"));
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng Ký Gói Liệu Trình</h1>
          <p className="text-sm text-gray-500">Đăng ký gói phục hồi 21 ngày cho bệnh nhân</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Bệnh nhân</h2>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{selectedPatient.fullName}</p>
                <p className="text-sm text-gray-500">{selectedPatient.code} · {selectedPatient.phone ?? "—"}</p>
              </div>
              {!preselectedPatientId && (
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                  className="text-sm text-red-500 hover:text-red-700">Đổi</button>
              )}
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tên hoặc mã bệnh nhân..."
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                onFocus={() => setShowPatientList(true)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {showPatientList && patients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {patients.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { setSelectedPatient(p); setShowPatientList(false); setPatientSearch(""); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <p className="font-medium text-sm text-gray-900">{p.fullName}</p>
                      <p className="text-xs text-gray-400">{p.code} · {p.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Program Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Gói liệu trình</h2>
          {programs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Đang tải danh sách gói...</p>
          ) : (
            <div className="space-y-3">
              {programs.map(prog => (
                <label key={prog.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedProgram?.id === prog.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <input
                    type="radio"
                    name="program"
                    value={prog.id}
                    checked={selectedProgram?.id === prog.id}
                    onChange={() => setSelectedProgram(prog)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{prog.name}</p>
                      <p className="font-bold text-green-600">{formatCurrency(prog.price)}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {prog.durationWeeks * 7} ngày ({prog.durationWeeks} tuần)
                    </p>
                    {prog.description && (
                      <p className="text-xs text-gray-400 mt-1">{prog.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Lịch trình</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày kết thúc</label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500">
                {endDate || "—"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tư vấn viên phụ trách
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="Tên tư vấn viên..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Ghi chú về tình trạng sức khoẻ ban đầu, mục tiêu, yêu cầu đặc biệt..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Summary */}
        {selectedProgram && selectedPatient && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-green-800 mb-2">📋 Tóm tắt đăng ký</p>
            <div className="space-y-1 text-green-700">
              <p>👤 Bệnh nhân: <strong>{selectedPatient.fullName}</strong></p>
              <p>🌿 Gói: <strong>{selectedProgram.name}</strong></p>
              <p>📅 Từ ngày <strong>{new Date(startDate).toLocaleDateString("vi-VN")}</strong> đến <strong>{endDate}</strong></p>
              <p>💰 Học phí: <strong>{formatCurrency(selectedProgram.price)}</strong></p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            Hủy
          </button>
          <button type="submit" disabled={saving || !selectedPatient || !selectedProgram}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
            {saving ? "Đang đăng ký..." : "✓ Đăng ký gói"}
          </button>
        </div>
      </form>
    </div>
  );
}
