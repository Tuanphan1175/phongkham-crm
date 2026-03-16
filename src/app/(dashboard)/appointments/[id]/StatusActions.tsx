"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AppointmentStatus =
  | "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const TRANSITIONS: Record<AppointmentStatus, { status: AppointmentStatus; label: string; color: string }[]> = {
  PENDING: [
    { status: "CONFIRMED",   label: "✓ Xác nhận",     color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { status: "CANCELLED",   label: "✕ Hủy lịch",     color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  CONFIRMED: [
    { status: "IN_PROGRESS", label: "▶ Bắt đầu khám", color: "bg-violet-600 hover:bg-violet-700 text-white" },
    { status: "NO_SHOW",     label: "✕ Vắng mặt",     color: "bg-gray-100 hover:bg-gray-200 text-gray-700" },
    { status: "CANCELLED",   label: "✕ Hủy lịch",     color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  IN_PROGRESS: [
    { status: "COMPLETED",   label: "✓ Hoàn thành",   color: "bg-green-600 hover:bg-green-700 text-white" },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function StatusActions({ id, status }: { id: string; status: AppointmentStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = TRANSITIONS[status] ?? [];
  if (actions.length === 0) return null;

  async function handleUpdate(nextStatus: AppointmentStatus) {
    setLoading(nextStatus);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Không thể cập nhật trạng thái");
    }
    setLoading(null);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <button
          key={action.status}
          onClick={() => handleUpdate(action.status)}
          disabled={loading !== null}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${action.color}`}
        >
          {loading === action.status ? "Đang cập nhật..." : action.label}
        </button>
      ))}
    </div>
  );
}
