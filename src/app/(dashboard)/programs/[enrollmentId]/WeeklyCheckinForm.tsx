"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProgramWeekTemplate {
  id: string;
  weekNumber: number;
  title: string;
  goals: string;
  mealPlan: unknown;
  supplements: unknown;
  activities: string | null;
  tips: string | null;
}

interface Props {
  enrollmentId: string;
  weekNumber: number;
  template?: ProgramWeekTemplate;
}

const DEFAULT_TASKS = [
  { key: "meal", label: "Tuân thủ thực đơn" },
  { key: "supplement", label: "Uống thuốc/TPCN đúng giờ" },
  { key: "exercise", label: "Vận động thể chất" },
  { key: "water", label: "Uống đủ 2L nước/ngày" },
  { key: "sleep", label: "Ngủ đủ giấc (7-8 tiếng)" },
];

export default function WeeklyCheckinForm({ enrollmentId, weekNumber }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_TASKS.map((t) => [t.key, false]))
  );
  const [patientFeedback, setPatientFeedback] = useState("");
  const [consultantNotes, setConsultantNotes] = useState("");
  const [nextWeekGoals, setNextWeekGoals] = useState("");

  const complianceScore = Math.round(
    (Object.values(tasks).filter(Boolean).length / DEFAULT_TASKS.length) * 100
  );

  async function handleSubmit() {
    setLoading(true);
    const res = await fetch(`/api/programs/${enrollmentId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekNumber,
        completedTasks: tasks,
        complianceScore,
        patientFeedback,
        consultantNotes,
        nextWeekGoals,
      }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Lỗi khi lưu check-in");
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
      >
        Check-in tuần {weekNumber}
      </button>
    );
  }

  return (
    <div className="space-y-4 mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
      <p className="font-medium text-sm text-green-800">Check-in tuần {weekNumber}</p>

      {/* Tasks */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">Nhiệm vụ đã hoàn thành trong tuần:</p>
        {DEFAULT_TASKS.map((task) => (
          <label key={task.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tasks[task.key] ?? false}
              onChange={(e) => setTasks((prev) => ({ ...prev, [task.key]: e.target.checked }))}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700">{task.label}</span>
          </label>
        ))}
        <div className="mt-1 text-xs text-green-700 font-medium">
          Tuân thủ: {complianceScore}%
        </div>
      </div>

      {/* Patient feedback */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Phản hồi của khách hàng
        </label>
        <textarea
          value={patientFeedback}
          onChange={(e) => setPatientFeedback(e.target.value)}
          rows={2}
          placeholder="Cảm nhận, triệu chứng thay đổi..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Consultant notes */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Ghi chú tư vấn viên
        </label>
        <textarea
          value={consultantNotes}
          onChange={(e) => setConsultantNotes(e.target.value)}
          rows={2}
          placeholder="Nhận xét, điều chỉnh phác đồ..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {weekNumber < 3 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Mục tiêu tuần tiếp theo
          </label>
          <textarea
            value={nextWeekGoals}
            onChange={(e) => setNextWeekGoals(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Đang lưu..." : "Lưu check-in"}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-white"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
