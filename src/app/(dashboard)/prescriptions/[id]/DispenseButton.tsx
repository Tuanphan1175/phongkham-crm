"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DispenseButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDispense() {
    if (!confirm("Xác nhận cấp phát đơn thuốc này?")) return;
    setLoading(true);
    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DISPENSED" }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Không thể cập nhật trạng thái");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDispense}
      disabled={loading}
      className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
    >
      {loading ? "Đang cập nhật..." : "✓ Cấp phát"}
    </button>
  );
}
