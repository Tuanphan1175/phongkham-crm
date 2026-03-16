import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, GENDER_LABELS } from "@/lib/utils";
import Link from "next/link";
import { StatusActions } from "./StatusActions";

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700 border border-yellow-200",
  CONFIRMED:   "bg-blue-100 text-blue-700 border border-blue-200",
  IN_PROGRESS: "bg-violet-100 text-violet-700 border border-violet-200",
  COMPLETED:   "bg-green-100 text-green-700 border border-green-200",
  CANCELLED:   "bg-red-100 text-red-700 border border-red-200",
  NO_SHOW:     "bg-gray-100 text-gray-600 border border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:     "Chờ xác nhận",
  CONFIRMED:   "Đã xác nhận",
  IN_PROGRESS: "Đang khám",
  COMPLETED:   "Hoàn thành",
  CANCELLED:   "Đã hủy",
  NO_SHOW:     "Vắng mặt",
};

const STATUS_ICONS: Record<string, string> = {
  PENDING:     "🕐",
  CONFIRMED:   "✅",
  IN_PROGRESS: "🩺",
  COMPLETED:   "✔️",
  CANCELLED:   "❌",
  NO_SHOW:     "👻",
};

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apt = await db.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true, fullName: true, code: true, phone: true,
          dateOfBirth: true, gender: true, insurance: true,
        },
      },
      doctor: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!apt) notFound();

  const age = apt.patient.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(apt.patient.dateOfBirth).getTime()) /
          (365.25 * 24 * 3600 * 1000)
      )
    : null;

  const scheduledDate = new Date(apt.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = scheduledDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
  });
  const endTime = new Date(scheduledDate.getTime() + apt.duration * 60000);
  const endTimeStr = endTime.toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
  });

  const isActive = !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(apt.status);

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/appointments" className="text-sm text-gray-400 hover:text-gray-600">
            ← Lịch hẹn
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Chi tiết lịch hẹn</h1>
          <p className="text-sm text-gray-400 font-mono">#{apt.id.slice(-8).toUpperCase()}</p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[apt.status]}`}>
          {STATUS_ICONS[apt.status]} {STATUS_LABELS[apt.status]}
        </span>
      </div>

      {/* Time card */}
      <div className="bg-teal-600 rounded-xl p-5 text-white">
        <p className="text-teal-200 text-sm mb-1">{dateStr}</p>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-bold tracking-tight">{timeStr}</p>
          <p className="text-teal-200 text-lg mb-0.5">→ {endTimeStr}</p>
          <span className="ml-auto text-sm bg-teal-500 px-3 py-1 rounded-full">
            {apt.duration} phút
          </span>
        </div>
        <p className="mt-3 text-teal-100 text-sm">
          🩺 BS. {apt.doctor.name}
          {apt.type && <span className="ml-3">· {apt.type}</span>}
        </p>
      </div>

      {/* Patient + Appointment info */}
      <div className="grid grid-cols-2 gap-4">
        {/* Patient */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bệnh nhân</h2>
            <Link
              href={`/patients/${apt.patient.id}`}
              className="text-xs text-teal-600 hover:underline"
            >
              Xem hồ sơ →
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900 text-base">{apt.patient.fullName}</p>
            <p className="text-sm text-gray-500 font-mono">{apt.patient.code}</p>
            {age !== null && (
              <p className="text-sm text-gray-500">
                {apt.patient.gender ? GENDER_LABELS[apt.patient.gender] + " · " : ""}
                {age} tuổi
              </p>
            )}
            {apt.patient.phone && (
              <p className="text-sm text-gray-600">📞 {apt.patient.phone}</p>
            )}
            {apt.patient.insurance && (
              <p className="text-sm text-gray-500">🏥 BHYT: {apt.patient.insurance}</p>
            )}
          </div>
        </div>

        {/* Appointment detail */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Thông tin</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Bác sĩ phụ trách</p>
              <p className="text-sm font-medium text-gray-800">BS. {apt.doctor.name}</p>
              {apt.doctor.phone && (
                <p className="text-xs text-gray-400">📞 {apt.doctor.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400">Loại khám</p>
              <p className="text-sm text-gray-800">{apt.type ?? "Khám bệnh thông thường"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Ngày tạo</p>
              <p className="text-sm text-gray-800">{formatDate(apt.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {apt.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-1">Ghi chú</h3>
          <p className="text-sm text-amber-700 leading-relaxed">{apt.notes}</p>
        </div>
      )}

      {/* Status flow indicator */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Tiến trình</h2>
        <div className="flex items-center gap-1">
          {(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const).map((s, i) => {
            const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];
            const currentIdx = statuses.indexOf(apt.status);
            const stepIdx = statuses.indexOf(s);
            const isCurrent = apt.status === s;
            const isDone = currentIdx > stepIdx;
            const isCancelled = apt.status === "CANCELLED" || apt.status === "NO_SHOW";

            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex-1 flex flex-col items-center gap-1`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    isCancelled ? "border-gray-200 text-gray-300" :
                    isDone ? "bg-teal-500 border-teal-500 text-white" :
                    isCurrent ? "bg-white border-teal-500 text-teal-600" :
                    "bg-white border-gray-200 text-gray-300"
                  }`}>
                    {isDone && !isCancelled ? "✓" : i + 1}
                  </div>
                  <p className={`text-xs text-center leading-tight ${
                    isCancelled ? "text-gray-300" :
                    isDone || isCurrent ? "text-teal-700 font-medium" : "text-gray-400"
                  }`}>
                    {STATUS_LABELS[s]}
                  </p>
                </div>
                {i < 3 && (
                  <div className={`h-0.5 flex-none w-6 mb-4 ${
                    isCancelled ? "bg-gray-100" :
                    isDone ? "bg-teal-400" : "bg-gray-200"
                  }`} />
                )}
              </div>
            );
          })}
          {(apt.status === "CANCELLED" || apt.status === "NO_SHOW") && (
            <div className="ml-3 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-red-300 bg-red-50 text-red-500">
                ✕
              </div>
              <p className="text-xs text-red-400 font-medium">{STATUS_LABELS[apt.status]}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status actions */}
      {isActive && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Cập nhật trạng thái</h2>
          <StatusActions id={apt.id} status={apt.status as never} />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {(apt.status === "IN_PROGRESS" || apt.status === "COMPLETED") && (
          <>
            <Link
              href={`/medical-records/new?patientId=${apt.patient.id}`}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
            >
              📋 Tạo bệnh án
            </Link>
            <Link
              href={`/prescriptions/new?patientId=${apt.patient.id}`}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              💊 Kê đơn thuốc
            </Link>
            <Link
              href={`/billing/new?patientId=${apt.patient.id}`}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              🧾 Tạo hóa đơn
            </Link>
          </>
        )}
        <Link
          href={`/patients/${apt.patient.id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          👤 Hồ sơ bệnh nhân
        </Link>
        <Link
          href={`/appointments/new?patientId=${apt.patient.id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          📅 Đặt lịch mới
        </Link>
      </div>
    </div>
  );
}
