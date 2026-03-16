"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Patient { id: string; fullName: string; code: string; phone: string | null }
interface Doctor { id: string; name: string }

const VITAL_FIELDS = [
  { key: "pulse",         label: "Mạch",        unit: "l/p",  placeholder: "80" },
  { key: "temperature",   label: "Nhiệt độ",    unit: "°C",   placeholder: "37.0" },
  { key: "bloodPressure", label: "Huyết áp",    unit: "",     placeholder: "120/80" },
  { key: "spo2",          label: "SpO2",         unit: "%",    placeholder: "98" },
  { key: "weight",        label: "Cân nặng",    unit: "kg",   placeholder: "60" },
] as const;

type VitalKey = typeof VITAL_FIELDS[number]["key"];

const emptyVitals: Record<VitalKey, string> = {
  pulse: "", temperature: "", bloodPressure: "", spo2: "", weight: "",
};

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prePatientId = searchParams.get("patientId") ?? "";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientList, setShowPatientList] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [vitalSigns, setVitalSigns] = useState<Record<VitalKey, string>>({ ...emptyVitals });
  const [labResults, setLabResults] = useState("");
  const [imagingResults, setImagingResults] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users?role=DOCTOR")
      .then(r => r.json())
      .then(d => setDoctors(Array.isArray(d) ? d : []))
      .catch(() => {});

    if (prePatientId) {
      fetch(`/api/patients/${prePatientId}`)
        .then(r => r.json())
        .then(d => { if (d?.id) setSelectedPatient(d); })
        .catch(() => {});
    }
  }, [prePatientId]);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&limit=6`)
        .then(r => r.json())
        .then(d => setPatients(d.patients ?? []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  function updateVital(key: VitalKey, value: string) {
    setVitalSigns(v => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedPatient) { setError("Vui lòng chọn bệnh nhân"); return; }
    if (!doctorId) { setError("Vui lòng chọn bác sĩ"); return; }

    setSaving(true);
    const hasVitals = Object.values(vitalSigns).some(v => v.trim());

    const res = await fetch("/api/medical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        doctorId,
        visitDate,
        chiefComplaint: chiefComplaint || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        vitalSigns: hasVitals ? vitalSigns : null,
        labResults: labResults || null,
        imagingResults: imagingResults || null,
        notes: notes || null,
        followUpDate: followUpDate || null,
      }),
    });

    if (res.ok) {
      router.push(`/medical-records?patientId=${selectedPatient.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Không thể lưu bệnh án");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <a
          href={prePatientId ? `/medical-records?patientId=${prePatientId}` : "/medical-records"}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Bệnh án
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Thêm bệnh án mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient + Doctor + Date */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin khám</h2>

          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bệnh nhân <span className="text-red-500">*</span>
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
                <div>
                  <span className="font-medium text-teal-900">{selectedPatient.fullName}</span>
                  <span className="text-teal-600 text-sm ml-2">({selectedPatient.code})</span>
                  {selectedPatient.phone && (
                    <span className="text-teal-500 text-sm ml-2">· {selectedPatient.phone}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                  className="text-xs text-teal-600 hover:text-teal-800 underline"
                >
                  Đổi
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân (tên, mã, SĐT)..."
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                  onFocus={() => setShowPatientList(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {showPatientList && patients.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                    {patients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedPatient(p); setShowPatientList(false); setPatientSearch(""); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900">{p.fullName}</p>
                        <p className="text-xs text-gray-400">{p.code}{p.phone ? ` · ${p.phone}` : ""}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bác sĩ <span className="text-red-500">*</span>
              </label>
              <select
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>BS. {d.name}</option>)}
              </select>
            </div>

            {/* Visit date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khám</label>
              <input
                type="date"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Chief complaint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do khám</label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              placeholder="Đau bụng, tiêu chảy, khó tiêu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Vital signs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Sinh hiệu</h2>
          <div className="grid grid-cols-5 gap-3">
            {VITAL_FIELDS.map(({ key, label, unit, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label}{unit ? ` (${unit})` : ""}
                </label>
                <input
                  type="text"
                  value={vitalSigns[key]}
                  onChange={e => updateVital(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Diagnosis + Treatment */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Chẩn đoán & Điều trị</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán</label>
            <textarea
              rows={3}
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="Chẩn đoán bệnh..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hướng điều trị</label>
            <textarea
              rows={3}
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              placeholder="Phương pháp điều trị, thuốc sử dụng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        {/* Lab + Imaging */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Kết quả cận lâm sàng</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xét nghiệm</label>
              <textarea
                rows={3}
                value={labResults}
                onChange={e => setLabResults(e.target.value)}
                placeholder="Công thức máu, sinh hóa..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh học</label>
              <textarea
                rows={3}
                value={imagingResults}
                onChange={e => setImagingResults(e.target.value)}
                placeholder="Siêu âm, X-quang, CT..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Notes + Follow-up */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Lưu ý thêm..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tái khám</label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {followUpDate && (
                <p className="mt-1.5 text-xs text-amber-600">
                  📅 Tái khám:{" "}
                  {new Date(followUpDate).toLocaleDateString("vi-VN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Đang lưu..." : "💾 Lưu bệnh án"}
          </button>
          <a
            href={prePatientId ? `/medical-records?patientId=${prePatientId}` : "/medical-records"}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </a>
        </div>
      </form>
    </div>
  );
}
