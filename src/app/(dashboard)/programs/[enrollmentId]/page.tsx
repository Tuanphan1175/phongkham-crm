import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, ENROLLMENT_STATUS_LABELS } from "@/lib/utils";
import Link from "next/link";
import WeeklyCheckinForm from "./WeeklyCheckinForm";
import HealthMetricsSection from "./HealthMetricsSection";

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const enrollment = await db.programEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      patient: true,
      program: { include: { weekTemplates: { orderBy: { weekNumber: "asc" } } } },
      weeklyProgress: { orderBy: { weekNumber: "asc" } },
      healthMetrics: { orderBy: { weekNumber: "asc" } },
    },
  });

  if (!enrollment) notFound();

  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - enrollment.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentWeek = Math.min(Math.ceil((daysSinceStart + 1) / 7), 3);
  const daysLeft = Math.max(0, Math.ceil((enrollment.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const checkedInWeeks = new Set(enrollment.weeklyProgress.map((p) => p.weekNumber));
  const baselineMetric = enrollment.healthMetrics.find((m) => m.weekNumber === 0);
  const latestMetric = enrollment.healthMetrics.sort((a, b) => b.weekNumber - a.weekNumber)[0];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/programs" className="text-sm text-gray-400 hover:text-gray-600">
            ← Danh sách gói liệu trình
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{enrollment.patient.fullName}</h1>
          <p className="text-sm text-gray-500">{enrollment.program.name}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            enrollment.status === "ACTIVE" ? "bg-green-100 text-green-700" :
            enrollment.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {ENROLLMENT_STATUS_LABELS[enrollment.status]}
          </span>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{currentWeek}</p>
          <p className="text-xs text-gray-500 mt-0.5">Tuần hiện tại</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{daysLeft}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ngày còn lại</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">
            {latestMetric?.digestiveScore ?? "—"}
            {latestMetric?.digestiveScore && <span className="text-sm font-normal text-gray-400">/10</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Điểm tiêu hóa</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">
            {latestMetric?.weight ? `${latestMetric.weight}kg` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Cân nặng hiện tại</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Patient info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
          <dl className="space-y-2.5">
            <div>
              <dt className="text-xs text-gray-400">Họ tên</dt>
              <dd className="text-sm font-medium text-gray-900">{enrollment.patient.fullName}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Điện thoại</dt>
              <dd className="text-sm text-gray-900">{enrollment.patient.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Bắt đầu</dt>
              <dd className="text-sm text-gray-900">{formatDate(enrollment.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Kết thúc</dt>
              <dd className="text-sm text-gray-900">{formatDate(enrollment.endDate)}</dd>
            </div>
            {enrollment.notes && (
              <div>
                <dt className="text-xs text-gray-400">Ghi chú</dt>
                <dd className="text-sm text-gray-900">{enrollment.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Weekly progress */}
        <div className="col-span-2 space-y-3">
          <h3 className="font-semibold text-gray-900">Tiến độ theo tuần</h3>
          {[1, 2, 3].map((week) => {
            const template = enrollment.program.weekTemplates.find((t) => t.weekNumber === week);
            const progress = enrollment.weeklyProgress.find((p) => p.weekNumber === week);
            const isDone = checkedInWeeks.has(week);
            const isCurrent = week === currentWeek && enrollment.status === "ACTIVE";
            const isLocked = week > currentWeek && enrollment.status === "ACTIVE";

            return (
              <div
                key={week}
                className={`bg-white rounded-xl border p-4 ${
                  isCurrent ? "border-green-300 ring-1 ring-green-200" :
                  isDone ? "border-gray-200" :
                  isLocked ? "border-gray-100 opacity-60" :
                  "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isDone ? "bg-green-500 text-white" :
                        isCurrent ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {isDone ? "✓" : week}
                      </span>
                      <p className="font-medium text-sm text-gray-900">
                        {template?.title ?? `Tuần ${week}`}
                      </p>
                      {isCurrent && (
                        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    {template?.goals && (
                      <p className="text-xs text-gray-400 mt-1 ml-8">{template.goals}</p>
                    )}
                  </div>
                  {progress?.complianceScore != null && (
                    <span className="text-sm font-semibold text-green-600">{progress.complianceScore}%</span>
                  )}
                </div>

                {progress ? (
                  <div className="ml-8 space-y-1">
                    {progress.patientFeedback && (
                      <p className="text-xs text-gray-600 italic">&ldquo;{progress.patientFeedback}&rdquo;</p>
                    )}
                    {progress.consultantNotes && (
                      <p className="text-xs text-blue-600">📝 {progress.consultantNotes}</p>
                    )}
                  </div>
                ) : isCurrent ? (
                  <div className="ml-8">
                    <WeeklyCheckinForm
                      enrollmentId={enrollment.id}
                      weekNumber={week}
                      template={template}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Health metrics section */}
      <HealthMetricsSection
        enrollmentId={enrollment.id}
        metrics={enrollment.healthMetrics}
        baselineMetric={baselineMetric ?? null}
        currentWeek={currentWeek}
        status={enrollment.status}
      />
    </div>
  );
}
