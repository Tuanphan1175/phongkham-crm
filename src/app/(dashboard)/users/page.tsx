"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  DOCTOR: "Bác sĩ",
  NURSE: "Điều dưỡng",
  RECEPTIONIST: "Lễ tân",
  PHARMACIST: "Dược sĩ",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border border-red-200",
  DOCTOR: "bg-blue-100 text-blue-700 border border-blue-200",
  NURSE: "bg-teal-100 text-teal-700 border border-teal-200",
  RECEPTIONIST: "bg-purple-100 text-purple-700 border border-purple-200",
  PHARMACIST: "bg-amber-100 text-amber-700 border border-amber-200",
};

const ROLES = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PHARMACIST"] as const;

const emptyForm = {
  name: "", email: "", password: "", role: "NURSE" as string, phone: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [filterRole, setFilterRole] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (showInactive) params.set("includeInactive", "true");
    const data = await fetch(`/api/users?${params}`).then(r => r.json()).catch(() => []);
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openCreate() {
    setEditUser(null);
    setForm({ ...emptyForm });
    setError("");
    setShowModal(true);
  }

  function openEdit(user: User) {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, phone: user.phone ?? "" });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
      phone: form.phone || undefined,
    };
    if (form.password) payload.password = form.password;
    if (!editUser) {
      if (!form.password) { setError("Vui lòng nhập mật khẩu"); setSaving(false); return; }
    }

    const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
    const method = editUser ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      fetchUsers();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(typeof err.error === "string" ? err.error : "Không thể lưu thông tin");
    }
    setSaving(false);
  }

  async function handleToggleActive(user: User) {
    const action = user.isActive ? "vô hiệu hóa" : "kích hoạt";
    if (!confirm(`Xác nhận ${action} tài khoản "${user.name}"?`)) return;

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });

    if (res.ok) fetchUsers();
    else alert("Không thể cập nhật trạng thái");
  }

  const filtered = users.filter(u =>
    (!filterRole || u.role === filterRole)
  );

  const activeCount = users.filter(u => u.isActive).length;
  const byRole = ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r && u.isActive).length }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500">{activeCount} tài khoản đang hoạt động</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          + Thêm tài khoản
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {byRole.map(({ role, count }) => (
          <button
            key={role}
            onClick={() => setFilterRole(filterRole === role ? "" : role)}
            className={`rounded-xl border p-4 text-left transition-all ${
              filterRole === role ? "ring-2 ring-teal-500 border-teal-300 bg-teal-50" : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className="text-xs text-gray-500 mt-1">{ROLE_LABELS[role]}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Hiển thị tài khoản đã vô hiệu hóa
        </label>
        {filterRole && (
          <button onClick={() => setFilterRole("")} className="text-sm text-teal-600 hover:underline">
            Xóa bộ lọc: {ROLE_LABELS[filterRole]}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Chức vụ</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Điện thoại</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">Đang tải...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">Không có tài khoản nào</td>
              </tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{user.phone ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {user.isActive ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-sm text-teal-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`text-sm hover:underline ${user.isActive ? "text-red-500" : "text-green-600"}`}
                      >
                        {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {editUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu {!editUser && <span className="text-red-500">*</span>}
                  {editUser && <span className="text-gray-400 text-xs font-normal"> (để trống = không đổi)</span>}
                </label>
                <input
                  type="password"
                  required={!editUser}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chức vụ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0901234567"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editUser ? "Lưu thay đổi" : "Tạo tài khoản"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
