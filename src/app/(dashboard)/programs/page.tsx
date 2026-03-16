import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate, ENROLLMENT_STATUS_LABELS } from "@/lib/utils";
import type { EnrollmentStatus } from "@prisma/client";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

async function getEnrollments(status: string, page: number) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const where = status && status !== "ALL" ? { status: status as EnrollmentStatus } : {};

  const [enrollments, total, activeCount] = await Promise.all([
    db.programEnrollment.findMany({
      where,
      include: {
        patient: { select: { fullName: true, code: true, phone: true } },
        program: { select: { name: true, durationWeeks: true } },
        weeklyProgress: { select: { weekNumber: true, complianceScore: true } },
        healthMetrics: { select: { weekNumber: true, digestiveScore: true, weight: true } },
      },
      orderBy: { startDate: "desc" },
      skip,
      take: limit,
    }),
    db.programEnrollment.count({ where }),
    db.programEnrollment.count({ where: { status: "ACTIVE" } }),
  ]);

  return { enrollments, total, activeCount };
}

function getDaysRemaining(endDate: Date) {
  const now = new Date();
  const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getLatestMetric(metrics: Array<{ weekNumber: number; digestiveScore: number | null; weight: number | null }>) {
  if (metrics.length === 0) return null;
  return metrics.sort((a, b) => b.weekNumber - a.weekNumber)[0];
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = statusParam ?? "ACTIVE";
  const page = parseInt(pageParam ?? "1");
  const { enrollments, activeCount } = await getEnrollments(status, page);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gói liệu trình 21 ngày</h1>
          <p className="text-sm text-slate-500">{activeCount} khách hàng đang thực hiện</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/programs/settings"
            className="border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Quản lý gói
          </Link>
          <Link
            href="/programs/new"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đăng ký gói
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {(["ACTIVE", "COMPLETED", "PAUSED", "ALL"] as const).map((s) => (
          <Link
            key={s}
            href={`/programs?status=${s}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === s ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s === "ALL" ? "Tất cả" : ENROLLMENT_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Enrollment cards */}
      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <p className="text-4xl mb-2">🌿</p>
          <p>Không có khách hàng nào</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {enrollments.map((enr) => {
            const daysLeft = getDaysRemaining(enr.endDate);
            const latestProgress = enr.weeklyProgress.sort((a, b) => b.weekNumber - a.weekNumber)[0];
            const latestMetric = getLatestMetric(enr.healthMetrics);
            const weeksDone = enr.weeklyProgress.length;

            return (
              <Link
                key={enr.id}
                href={`/programs/${enr.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-gray-900">{enr.patient.fullName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[enr.status]}`}>
                        {ENROLLMENT_STATUS_LABELS[enr.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      {enr.patient.code} · {enr.patient.phone ?? "—"} · {enr.program.name}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Tiến độ: Tuần {Math.min(weeksDone + 1, 3)} / 3</span>
                        <span>{formatDate(enr.startDate)} → {formatDate(enr.endDate)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${Math.min((weeksDone / 3) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div className="flex gap-4 text-xs text-gray-500">
                      {latestMetric?.digestiveScore != null && (
                        <span>🫁 Tiêu hóa: <strong className="text-gray-800">{latestMetric.digestiveScore}/10</strong></span>
                      )}
                      {latestMetric?.weight != null && (
                        <span>⚖️ Cân nặng: <strong className="text-gray-800">{latestMetric.weight}kg</strong></span>
                      )}
                      {latestProgress?.complianceScore != null && (
                        <span>✅ Tuân thủ: <strong className="text-gray-800">{latestProgress.complianceScore}%</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Days remaining badge */}
                  {enr.status === "ACTIVE" && (
                    <div className={`text-center px-3 py-2 rounded-lg ml-4 ${
                      daysLeft <= 3 ? "bg-red-50 text-red-700" :
                      daysLeft <= 7 ? "bg-yellow-50 text-yellow-700" :
                      "bg-green-50 text-green-700"
                    }`}>
                      <p className="text-lg font-bold">{Math.max(0, daysLeft)}</p>
                      <p className="text-xs">ngày còn lại</p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
