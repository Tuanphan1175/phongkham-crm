"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Patient { id: string; code: string; fullName: string; phone?: string; }
interface Service { id: string; code: string; name: string; price: number; category: string; }
interface InvoiceItem { description: string; serviceId?: string; quantity: number; unitPrice: number; }

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function NewBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prescriptionId = searchParams.get("prescriptionId");
  const patientIdParam = searchParams.get("patientId");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [prescriptionNote, setPrescriptionNote] = useState("");

  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then(setServices).catch(() => {});
  }, []);

  // Load prescription items if prescriptionId provided
  useEffect(() => {
    if (!prescriptionId) return;
    fetch(`/api/prescriptions/${prescriptionId}`)
      .then(r => r.json())
      .then(rx => {
        if (!rx?.id) return;
        // Pre-select patient
        if (rx.patient) setSelectedPatient(rx.patient);
        // Pre-populate items from prescription medicines
        const rxItems: InvoiceItem[] = rx.items
          .filter((it: { medicine: { sellPrice?: number } }) => (it.medicine?.sellPrice ?? 0) > 0)
          .map((it: { medicine: { name: string; sellPrice: number; unit: string }; quantity: number }) => ({
            description: it.medicine.name,
            quantity: it.quantity,
            unitPrice: it.medicine.sellPrice,
          }));
        if (rxItems.length > 0) setItems(rxItems);
        setPrescriptionNote(`Đơn thuốc #${rx.id.slice(-8).toUpperCase()} – ${rx.patient?.fullName ?? ""}`);
      })
      .catch(() => {});
  }, [prescriptionId]);

  // Load patient if patientId provided (without prescription)
  useEffect(() => {
    if (!patientIdParam || prescriptionId) return;
    fetch(`/api/patients/${patientIdParam}`)
      .then(r => r.json())
      .then(p => { if (p?.id) setSelectedPatient(p); })
      .catch(() => {});
  }, [patientIdParam, prescriptionId]);

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

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(i: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof InvoiceItem, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function selectService(i: number, svc: Service) {
    setItems(items.map((item, idx) =>
      idx === i ? { ...item, serviceId: svc.id, description: svc.name, unitPrice: svc.price } : item
    ));
  }

  const totalAmount = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) { alert("Vui lòng chọn bệnh nhân!"); return; }
    const emptyItems = items.filter(it => !it.description.trim() || it.unitPrice <= 0);
    if (emptyItems.length > 0) { alert("Vui lòng điền đầy đủ thông tin các dịch vụ!"); return; }

    setSaving(true);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        items: items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
        discountAmount: Number(discountAmount),
        notes,
      }),
    });

    if (res.ok) {
      await res.json();
      router.push(`/billing`);
    } else {
      alert("Lỗi tạo hóa đơn!");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Hóa Đơn</h1>
          <p className="text-sm text-gray-500">Lập hóa đơn dịch vụ cho bệnh nhân</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Prescription source banner */}
        {prescriptionNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
            💊 Tạo từ <strong>{prescriptionNote}</strong> — giá thuốc đã được điền sẵn
          </div>
        )}

        {/* Patient */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Bệnh nhân</h2>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{selectedPatient.fullName}</p>
                <p className="text-sm text-gray-500">{selectedPatient.code} · {selectedPatient.phone}</p>
              </div>
              <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                className="text-sm text-red-500 hover:text-red-700">Đổi</button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tên hoặc mã bệnh nhân..."
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                onFocus={() => setShowPatientList(true)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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

        {/* Services/Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dịch vụ / Sản phẩm</h2>
            <button type="button" onClick={addItem}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              + Thêm dòng
            </button>
          </div>

          {/* Quick service buttons */}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
              <p className="w-full text-xs text-gray-400 mb-1">Chọn nhanh dịch vụ:</p>
              {services.slice(0, 6).map(svc => (
                <button key={svc.id} type="button"
                  onClick={() => {
                    const emptyIdx = items.findIndex(it => !it.description.trim());
                    if (emptyIdx >= 0) selectService(emptyIdx, svc);
                    else { setItems([...items, { serviceId: svc.id, description: svc.name, quantity: 1, unitPrice: svc.price }]); }
                  }}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-teal-100 hover:text-teal-700 rounded-full transition-colors">
                  {svc.name} — {formatCurrency(svc.price)}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Tên dịch vụ / mô tả"
                    value={item.description}
                    onChange={e => updateItem(i, "description", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="1" placeholder="SL"
                    value={item.quantity}
                    onChange={e => updateItem(i, "quantity", Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number" min="0" placeholder="Đơn giá (VND)"
                    value={item.unitPrice || ""}
                    onChange={e => updateItem(i, "unitPrice", Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button type="button" onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 disabled:opacity-30"
                    disabled={items.length === 1}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 mb-2">Thanh toán</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tạm tính</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-600">Giảm giá (VND)</span>
            <input
              type="number" min="0"
              value={discountAmount || ""}
              onChange={e => setDiscountAmount(Number(e.target.value))}
              className="w-40 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Tổng cộng</span>
            <span className="text-xl font-bold text-teal-600">{formatCurrency(finalAmount)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Ghi chú thêm..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            Hủy
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
            {saving ? "Đang tạo..." : "Tạo hóa đơn"}
          </button>
        </div>
      </form>
    </div>
  );
}
