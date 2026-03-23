"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReturnMedicineButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReturn() {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn thuốc và trả lại thuốc vào kho?")) return;
    setLoading(true);
    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Không thể trả lại thuốc");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReturn}
      disabled={loading}
      className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
    >
      {loading ? "Đang xử lý..." : "✕ Trả thuốc / Hủy đơn"}
    </button>
  );
}
