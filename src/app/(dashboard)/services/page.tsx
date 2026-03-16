"use client";

import { useState, useEffect, useCallback } from "react";

interface Service {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string | null;
  isActive: boolean;
}

const CATEGORIES = ["Khám", "Xét nghiệm", "Hình ảnh", "Tư vấn", "Điều trị", "Khác"];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}

const EMPTY_FORM = { code: "", name: "", category: "Khám", price: "", unit: "lần", description: "" };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", category: "", unit: "", description: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/services?includeInactive=true");
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(svc: Service) {
    setEditingId(svc.id);
    setEditForm({ name: svc.name, price: String(svc.price), category: svc.category, unit: svc.unit, description: svc.description ?? "" });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, price: Number(editForm.price) }),
    });
    setEditingId(null);
    await load();
    setSaving(false);
  }

  async function toggleActive(svc: Service) {
    await fetch(`/api/services/${svc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    await load();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, price: Number(addForm.price) }),
    });
    if (res.ok) {
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
      await load();
    } else {
      alert("Lỗi thêm dịch vụ");
    }
    setSaving(false);
  }

  const filtered = filterCategory === "ALL" ? services : services.filter(s => s.category === filterCategory);
  const allCategories = Array.from(new Set(services.map(s => s.category)));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dịch vụ & Giá</h1>
          <p className="text-sm text-gray-400 mt-0.5">{services.filter(s => s.isActive).length} dịch vụ đang hoạt động</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          + Thêm dịch vụ
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Thêm dịch vụ mới</h2>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mã dịch vụ</label>
                <input
                  type="text" placeholder="SVC001 (tự động nếu bỏ trống)"
                  value={addForm.code}
                  onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Tên dịch vụ <span className="text-red-500">*</span></label>
                <input
                  type="text" placeholder="Khám tổng quát..." required
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
                <select
                  value={addForm.category}
                  onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Giá (VND) <span className="text-red-500">*</span></label>
                <input
                  type="number" min="0" placeholder="150000" required
                  value={addForm.price}
                  onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Đơn vị</label>
                <input
                  type="text" placeholder="lần"
                  value={addForm.unit}
                  onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-500 mb-1">Mô tả</label>
                <input
                  type="text" placeholder="Mô tả dịch vụ..."
                  value={addForm.description}
                  onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Hủy
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                {saving ? "Đang lưu..." : "Thêm dịch vụ"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === "ALL" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        >
          Tất cả ({services.length})
        </button>
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === cat ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            {cat} ({services.filter(s => s.category === cat).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chưa có dịch vụ nào</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tên dịch vụ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Giá</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ĐVT</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(svc => (
                <tr key={svc.id} className={`hover:bg-gray-50 ${!svc.isActive ? "opacity-50" : ""}`}>
                  {editingId === svc.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.category}
                          onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="0"
                          value={editForm.price}
                          onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.unit}
                          onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">—</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => saveEdit(svc.id)} disabled={saving}
                            className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50">
                            Lưu
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-3 py-1 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                            Hủy
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                        {svc.description && <p className="text-xs text-gray-400">{svc.description}</p>}
                        <p className="text-xs text-gray-400 font-mono">{svc.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{svc.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(svc.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{svc.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(svc)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${svc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {svc.isActive ? "Hoạt động" : "Ẩn"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEdit(svc)}
                          className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                        >
                          Sửa
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
