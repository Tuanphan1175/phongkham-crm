"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Patient { id: string; fullName: string; code: string; phone: string | null }
interface Doctor { id: string; name: string }
interface Medicine { id: string; code: string; name: string; unit: string; stockQty: number; concentration: string | null }

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  unit: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prePatientId = searchParams.get("patientId") ?? "";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showMedicineList, setShowMedicineList] = useState<number | null>(null);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);

  const [doctorId, setDoctorId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicineId: "", medicineName: "", unit: "", quantity: 1, dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users?role=DOCTOR")
      .then(r => r.json())
      .then(setDoctors)
      .catch(() => {});

    fetch("/api/medicines?limit=200")
      .then(r => r.json())
      .then(d => setMedicines(d.medicines ?? d))
      .catch(() => {});

    if (prePatientId) {
      fetch(`/api/patients/${prePatientId}`)
        .then(r => r.json())
        .then(setSelectedPatient)
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

  useEffect(() => {
    if (!medicineSearch.trim()) { setFilteredMedicines([]); return; }
    const q = medicineSearch.toLowerCase();
    setFilteredMedicines(
      medicines.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)).slice(0, 8)
    );
  }, [medicineSearch, medicines]);

  function selectMedicine(idx: number, med: Medicine) {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, medicineId: med.id, medicineName: med.name, unit: med.unit } : item
    ));
    setShowMedicineList(null);
    setMedicineSearch("");
  }

  function updateItem(idx: number, field: keyof PrescriptionItem, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems([...items, { medicineId: "", medicineName: "", unit: "", quantity: 1, dosage: "", frequency: "", duration: "", instructions: "" }]);
  }

  function removeItem(idx: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedPatient) { setError("Vui lòng chọn bệnh nhân"); return; }
    if (!doctorId) { setError("Vui lòng chọn bác sĩ"); return; }

    const invalidItems = items.filter(it => !it.medicineId || !it.dosage || !it.frequency || !it.duration);
    if (invalidItems.length > 0) { setError("Vui lòng điền đầy đủ thông tin thuốc"); return; }

    setSaving(true);
    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        doctorId,
        diagnosis,
        notes,
        items: items.map(it => ({
          medicineId: it.medicineId,
          quantity: Number(it.quantity),
          dosage: it.dosage,
          frequency: it.frequency,
          duration: it.duration,
          instructions: it.instructions || undefined,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/prescriptions/${data.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error?.message ?? "Không thể tạo đơn thuốc");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/prescriptions" className="text-sm text-gray-400 hover:text-gray-600">← Danh sách đơn thuốc</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Kê đơn thuốc mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient + Doctor */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin kê đơn</h2>

          {/* Patient search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh nhân <span className="text-red-500">*</span></label>
            {selectedPatient ? (
              <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
                <div>
                  <span className="font-medium text-teal-900">{selectedPatient.fullName}</span>
                  <span className="text-teal-600 text-sm ml-2">({selectedPatient.code})</span>
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                  className="text-xs text-teal-600 hover:text-teal-800 underline">Đổi</button>
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
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedPatient(p); setShowPatientList(false); setPatientSearch(""); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <p className="text-sm font-medium text-gray-900">{p.fullName}</p>
                        <p className="text-xs text-gray-400">{p.code}{p.phone ? ` · ${p.phone}` : ""}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bác sĩ kê đơn <span className="text-red-500">*</span></label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map(d => <option key={d.id} value={d.id}>BS. {d.name}</option>)}
            </select>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán</label>
            <input
              type="text"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="Nhập chẩn đoán..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Medicine items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Danh sách thuốc</h2>
            <button type="button" onClick={addItem}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              + Thêm thuốc
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                {/* Medicine search */}
                <div className="flex-1 relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên thuốc <span className="text-red-500">*</span></label>
                  {item.medicineId ? (
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-gray-900">{item.medicineName}</span>
                      <button type="button"
                        onClick={() => { updateItem(idx, "medicineId", ""); updateItem(idx, "medicineName", ""); }}
                        className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Tìm thuốc..."
                        value={showMedicineList === idx ? medicineSearch : ""}
                        onChange={e => { setMedicineSearch(e.target.value); setShowMedicineList(idx); }}
                        onFocus={() => setShowMedicineList(idx)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {showMedicineList === idx && filteredMedicines.length > 0 && (
                        <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                          {filteredMedicines.map(m => (
                            <button key={m.id} type="button"
                              onClick={() => selectMedicine(idx, m)}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                              <p className="text-sm font-medium text-gray-900">{m.name} {m.concentration ?? ""}</p>
                              <p className="text-xs text-gray-400">{m.code} · Tồn: {m.stockQty} {m.unit}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Số lượng</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {item.unit && <span className="text-xs text-gray-400 whitespace-nowrap">{item.unit}</span>}
                  </div>
                </div>

                {/* Remove button */}
                <div className="pt-5">
                  <button type="button" onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none" title="Xóa">
                    ×
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Liều dùng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="VD: 1 viên/lần"
                    value={item.dosage}
                    onChange={e => updateItem(idx, "dosage", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tần suất <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="VD: 2 lần/ngày"
                    value={item.frequency}
                    onChange={e => updateItem(idx, "frequency", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="VD: 7 ngày"
                    value={item.duration}
                    onChange={e => updateItem(idx, "duration", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hướng dẫn sử dụng</label>
                <input
                  type="text"
                  placeholder="VD: Uống sau ăn, uống nhiều nước..."
                  value={item.instructions}
                  onChange={e => updateItem(idx, "instructions", e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Lưu ý đặc biệt cho bệnh nhân..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
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
            {saving ? "Đang lưu..." : "💊 Lưu đơn thuốc"}
          </button>
          <a
            href="/prescriptions"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </a>
        </div>
      </form>
    </div>
  );
}
