import { db } from "@/lib/db";
import Link from "next/link";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-600 border-gray-200",
};

async function getAppointments(date: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return db.appointment.findMany({
    where: { scheduledAt: { gte: start, lte: end } },
    include: { patient: true, doctor: true },
    orderBy: { scheduledAt: "asc" },
  });
}

async function getDoctors() {
  return db.user.findMany({
    where: { role: { in: ["DOCTOR", "ADMIN"] }, isActive: true },
    select: { id: true, name: true },
  });
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const { date } = await searchParams;
  const selectedDate = date ?? today;

  const [appointments] = await Promise.all([
    getAppointments(selectedDate),
    getDoctors(),
  ]);

  const grouped = appointments.reduce((acc, apt) => {
    const key = apt.doctorId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {} as Record<string, typeof appointments>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lịch hẹn</h1>
          <p className="text-sm text-gray-500">{appointments.length} lịch hẹn</p>
        </div>
        <Link
          href="/appointments/new"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          + Đặt lịch hẹn
        </Link>
      </div>

      {/* Date picker */}
      <form method="GET" className="flex items-center gap-3">
        <input
          type="date"
          name="date"
          defaultValue={selectedDate}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          Xem
        </button>
        <div className="flex gap-1 ml-auto">
          {(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const).map((s) => {
            const count = appointments.filter((a) => a.status === s).length;
            if (count === 0) return null;
            return (
              <span key={s} className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[s]}`}>
                {APPOINTMENT_STATUS_LABELS[s]}: {count}
              </span>
            );
          })}
        </div>
      </form>

      {/* Appointments by doctor */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <p className="text-4xl mb-2">📅</p>
          <p>Không có lịch hẹn nào trong ngày này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([doctorId, apts]) => {
            const doctor = apts[0].doctor;
            return (
              <div key={doctorId} className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <p className="font-medium text-gray-800 text-sm">BS. {doctor.name}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {apts.map((apt) => (
                    <div key={apt.id} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="text-sm font-mono text-gray-500 w-14">
                        {apt.scheduledAt.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{apt.patient.fullName}</p>
                        <p className="text-xs text-gray-400">{apt.type ?? "Khám bệnh"} · {apt.duration} phút</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[apt.status]}`}>
                        {APPOINTMENT_STATUS_LABELS[apt.status]}
                      </span>
                      <Link
                        href={`/appointments/${apt.id}`}
                        className="text-xs text-teal-600 hover:underline"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
