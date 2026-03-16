"use client";

import { useState, useEffect, useCallback } from "react";

interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  unit: string;
  dosageForm?: string;
  stockQty: number;
  minStockQty: number;
  costPrice: number;
  sellPrice: number;
  isActive: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", genericName: "", sellPrice: "", costPrice: "" });
  const [form, setForm] = useState({
    code: "", name: "", genericName: "", unit: "Viên",
    dosageForm: "", stockQty: 0, minStockQty: 10,
    costPrice: 0, sellPrice: 0, notes: "",
  });

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showLowStock) params.set("lowStock", "true");
    const res = await fetch(`/api/medicines?${params}`);
    const data = await res.json();
    setMedicines(data);
    setLoading(false);
  }, [search, showLowStock]);

  useEffect(() => {
    const timer = setTimeout(fetchMedicines, 300);
    return () => clearTimeout(timer);
  }, [fetchMedicines]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        stockQty: Number(form.stockQty),
        minStockQty: Number(form.minStockQty),
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
      }),
    });
    if (res.ok) {
      setShowAddModal(false);
      setForm({ code: "", name: "", genericName: "", unit: "Viên", dosageForm: "", stockQty: 0, minStockQty: 10, costPrice: 0, sellPrice: 0, notes: "" });
      fetchMedicines();
    } else {
      alert("Lỗi khi thêm thuốc!");
    }
    setSaving(false);
  }

  function startEdit(med: Medicine) {
    setEditingId(med.id);
    setEditForm({ name: med.name, genericName: med.genericName ?? "", sellPrice: String(med.sellPrice), costPrice: String(med.costPrice) });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await fetch(`/api/medicines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, sellPrice: Number(editForm.sellPrice), costPrice: Number(editForm.costPrice) }),
    });
    setEditingId(null);
    fetchMedicines();
    setSaving(false);
  }

  const lowStockCount = medicines.filter(m => m.stockQty <= m.minStockQty).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kho Thuốc</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh mục và tồn kho thuốc</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
        >
          <span>+</span> Thêm thuốc
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tổng loại thuốc</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{medicines.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${lowStockCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
          <p className="text-sm text-gray-500">Sắp hết hàng</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? "text-red-600" : "text-gray-900"}`}>{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tổng giá trị tồn kho</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(medicines.reduce((sum, m) => sum + m.stockQty * m.costPrice, 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm tên thuốc, mã thuốc..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            showLowStock ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          ⚠️ Sắp hết hàng
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Mã / Tên thuốc</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Dạng bào chế</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Đơn vị</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Tồn kho</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Giá bán</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Đang tải...</td></tr>
            ) : medicines.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <p className="text-3xl mb-2">💊</p>
                  <p>Không tìm thấy thuốc nào</p>
                </td>
              </tr>
            ) : (
              medicines.map((med) => {
                const isLow = med.stockQty <= med.minStockQty;
                const isEditing = editingId === med.id;
                return (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-400 font-mono">{med.code}</p>
                      {isEditing ? (
                        <input
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mt-0.5"
                        />
                      ) : (
                        <p className="font-medium text-gray-900 text-sm">{med.name}</p>
                      )}
                      {isEditing ? (
                        <input
                          value={editForm.genericName}
                          onChange={e => setEditForm(f => ({ ...f, genericName: e.target.value }))}
                          placeholder="Tên hoạt chất..."
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs mt-1 focus:outline-none focus:ring-1 focus:ring-teal-400 text-gray-500"
                        />
                      ) : (
                        med.genericName && <p className="text-xs text-gray-500 italic">{med.genericName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{med.dosageForm ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{med.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${isLow ? "text-red-600" : "text-gray-900"}`}>
                        {med.stockQty.toLocaleString("vi-VN")}
                      </span>
                      {isLow && <p className="text-xs text-red-500">⚠️ Sắp hết</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number" min="0"
                          value={editForm.sellPrice}
                          onChange={e => setEditForm(f => ({ ...f, sellPrice: e.target.value }))}
                          className="w-28 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(med.sellPrice)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        med.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {med.isActive ? "Đang dùng" : "Ngừng"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => saveEdit(med.id)} disabled={saving}
                            className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50">
                            Lưu
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(med)}
                          className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                          Sửa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Thêm thuốc mới</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã thuốc *</label>
                  <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="TH001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị *</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Viên</option><option>Gói</option><option>Chai</option>
                    <option>Ống</option><option>Hộp</option><option>Tuýp</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên thuốc *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Pantoprazole 40mg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hoạt chất</label>
                <input value={form.genericName} onChange={e => setForm({...form, genericName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Pantoprazole" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dạng bào chế</label>
                <select value={form.dosageForm} onChange={e => setForm({...form, dosageForm: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">-- Chọn --</option>
                  <option>Viên nén</option><option>Viên nang</option><option>Viên sủi</option>
                  <option>Bột</option><option>Dung dịch</option><option>Siro</option><option>Kem</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho ban đầu</label>
                  <input type="number" min="0" value={form.stockQty} onChange={e => setForm({...form, stockQty: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cảnh báo tồn tối thiểu</label>
                  <input type="number" min="0" value={form.minStockQty} onChange={e => setForm({...form, minStockQty: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập (VND) *</label>
                  <input type="number" min="0" required value={form.costPrice} onChange={e => setForm({...form, costPrice: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VND) *</label>
                  <input type="number" min="0" required value={form.sellPrice} onChange={e => setForm({...form, sellPrice: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
                  {saving ? "Đang lưu..." : "Lưu thuốc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
