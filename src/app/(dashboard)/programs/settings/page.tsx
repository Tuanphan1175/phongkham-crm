"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Program {
  id: string;
  code: string;
  name: string;
  price: number;
  description: string | null;
  durationWeeks: number;
  isActive: boolean;
  _count?: { enrollments: number };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

const TIER_STYLE: Record<string, { badge: string; icon: string; ring: string }> = {
  "Gói Cơ Bản":   { badge: "bg-slate-100 text-slate-700 border border-slate-200",   icon: "🌱", ring: "ring-slate-200" },
  "Gói Nâng Cao": { badge: "bg-blue-100 text-blue-800 border border-blue-200",       icon: "⭐", ring: "ring-blue-200" },
  "Gói VIP":      { badge: "bg-amber-100 text-amber-800 border border-amber-300",    icon: "👑", ring: "ring-amber-300" },
};

function getTierStyle(name: string) {
  return TIER_STYLE[name] ?? { badge: "bg-teal-100 text-teal-800 border border-teal-200", icon: "📦", ring: "ring-teal-200" };
}

export default function ProgramSettingsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", price: "", description: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchPrograms(); }, []);

  async function fetchPrograms() {
    setLoading(true);
    const res = await fetch("/api/programs");
    if (res.ok) {
      const data = await res.json();
      setPrograms(data);
    }
    setLoading(false);
  }

  function startEdit(prog: Program) {
    setEditingId(prog.id);
    setEditForm({
      name: prog.name,
      price: String(prog.price),
      description: prog.description ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", price: "", description: "" });
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.price) return;
    setSaving(true);
    const res = await fetch(`/api/programs/manage/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        price: Number(editForm.price),
        description: editForm.description.trim() || null,
      }),
    });
    if (res.ok) {
      await fetchPrograms();
      setEditingId(null);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Lỗi cập nhật gói");
    }
    setSaving(false);
  }

  async function addProgram() {
    if (!newForm.name.trim() || !newForm.price) return;
    setAdding(true);
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newForm.name.trim(),
        price: Number(newForm.price),
        description: newForm.description.trim() || null,
      }),
    });
    if (res.ok) {
      await fetchPrograms();
      setShowAddForm(false);
      setNewForm({ name: "", price: "", description: "" });
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Lỗi tạo gói");
    }
    setAdding(false);
  }

  async function toggleActive(id: string, current: boolean) {
    if (!confirm(current ? "Ẩn gói này khỏi danh sách đăng ký?" : "Kích hoạt lại gói này?")) return;
    await fetch(`/api/programs/manage/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    await fetchPrograms();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Gói Liệu Trình</h1>
          <p className="text-sm text-slate-500">Cài đặt tên, giá và mô tả các gói 21 ngày</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm gói
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
          <p className="text-3xl mb-2">🌿</p>
          <p className="text-sm">Đang tải...</p>
        </div>
      )}

      {/* Program cards */}
      {!loading && (
        <div className="space-y-4">
          {programs.map((prog) => {
            const style = getTierStyle(prog.name);
            const isEditing = editingId === prog.id;

            return (
              <div key={prog.id}
                className={`bg-white rounded-xl border-2 shadow-sm transition-all ${isEditing ? `ring-2 ${style.ring} border-transparent` : "border-slate-200"}`}>
                {isEditing ? (
                  /* Edit mode */
                  <div className="p-6 space-y-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chỉnh sửa gói</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên gói</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="VD: Gói Cơ Bản"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Giá (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          value={editForm.price}
                          onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="1500000"
                        />
                        {editForm.price && !isNaN(Number(editForm.price)) && (
                          <p className="text-xs text-teal-600 mt-1 font-medium">
                            = {formatCurrency(Number(editForm.price))}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
                        <textarea
                          rows={3}
                          value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Mô tả nội dung gói liệu trình..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button onClick={cancelEdit}
                        className="flex-1 border border-slate-300 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
                        Hủy
                      </button>
                      <button
                        onClick={() => saveEdit(prog.id)}
                        disabled={saving || !editForm.name.trim() || !editForm.price}
                        className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60"
                      >
                        {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="p-5 flex items-start gap-4">
                    <div className="text-3xl mt-1 shrink-0">{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{prog.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.badge}`}>
                          {prog.durationWeeks * 7} ngày
                        </span>
                        {!prog.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 font-semibold">
                            Ẩn
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-teal-600 mb-1.5">
                        {formatCurrency(prog.price)}
                      </p>
                      {prog.description && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{prog.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {prog._count?.enrollments ?? 0} học viên đã đăng ký
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(prog)}
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa
                      </button>
                      <button
                        onClick={() => toggleActive(prog.id, prog.isActive)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          prog.isActive
                            ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {prog.isActive ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {programs.length === 0 && !loading && (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
              <p className="text-3xl mb-2">🌿</p>
              <p className="text-sm">Chưa có gói nào. Chạy seed hoặc thêm gói mới.</p>
            </div>
          )}
        </div>
      )}

      {/* Add new program form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border-2 border-green-200 ring-2 ring-green-100 shadow-sm p-6 space-y-4">
          <p className="text-sm font-bold text-green-800">➕ Thêm gói liệu trình mới</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên gói <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newForm.name}
                onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="VD: Gói Platinum"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giá (VNĐ) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                step="50000"
                value={newForm.price}
                onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="2000000"
              />
              {newForm.price && !isNaN(Number(newForm.price)) && (
                <p className="text-xs text-teal-600 mt-1 font-medium">= {formatCurrency(Number(newForm.price))}</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
              <textarea
                rows={3}
                value={newForm.description}
                onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Mô tả nội dung gói..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowAddForm(false); setNewForm({ name: "", price: "", description: "" }); }}
              className="flex-1 border border-slate-300 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
              Hủy
            </button>
            <button
              onClick={addProgram}
              disabled={adding || !newForm.name.trim() || !newForm.price}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {adding ? "Đang tạo..." : "✓ Tạo gói"}
            </button>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">💡 Lưu ý</p>
        <ul className="space-y-1 text-amber-700 list-disc list-inside">
          <li>Thay đổi giá chỉ ảnh hưởng đến đăng ký <strong>mới</strong>, không thay đổi giá đã đăng ký trước</li>
          <li>Ẩn gói sẽ không hiển thị trong form đăng ký nhưng dữ liệu cũ vẫn giữ nguyên</li>
          <li>Chỉ tài khoản <strong>Quản trị viên</strong> mới có thể chỉnh sửa gói</li>
        </ul>
      </div>
    </div>
  );
}
