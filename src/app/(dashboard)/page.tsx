import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    todayAppointments,
    activeEnrollments,
    monthRevenue,
    lowStockMedicines,
  ] = await Promise.all([
    db.patient.count(),
    db.appointment.count({
      where: { scheduledAt: { gte: today, lt: tomorrow } },
    }),
    db.programEnrollment.count({ where: { status: "ACTIVE" } }),
    db.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
        },
      },
      _sum: { finalAmount: true },
    }),
    db.medicine.count({
      where: { stockQty: { lte: db.medicine.fields.minStockQty } },
    }).catch(() => 0),
  ]);

  return {
    totalPatients,
    todayAppointments,
    activeEnrollments,
    monthRevenue: Number(monthRevenue._sum.finalAmount ?? 0),
    lowStockMedicines,
  };
}

async function getRecentAppointments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return db.appointment.findMany({
    where: { scheduledAt: { gte: today, lt: tomorrow } },
    include: { patient: true, doctor: true },
    orderBy: { scheduledAt: "asc" },
    take: 8,
  });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ",
  CONFIRMED: "Xác nhận",
  IN_PROGRESS: "Đang khám",
  COMPLETED: "Xong",
  CANCELLED: "Hủy",
  NO_SHOW: "Vắng",
};

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();
  const appointments = await getRecentAppointments();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {session?.user.name}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng bệnh nhân"
          value={stats.totalPatients.toLocaleString("vi-VN")}
          icon="👥"
          href="/patients"
          color="bg-blue-50 border-blue-100"
        />
        <StatCard
          label="Lịch hẹn hôm nay"
          value={stats.todayAppointments.toString()}
          icon="📅"
          href="/appointments"
          color="bg-teal-50 border-teal-100"
        />
        <StatCard
          label="Gói 21 ngày đang chạy"
          value={stats.activeEnrollments.toString()}
          icon="🌿"
          href="/programs"
          color="bg-green-50 border-green-100"
        />
        <StatCard
          label="Doanh thu tháng này"
          value={formatCurrency(stats.monthRevenue)}
          icon="💰"
          href="/reports"
          color="bg-amber-50 border-amber-100"
        />
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Lịch hẹn hôm nay</h2>
          <Link href="/appointments" className="text-sm text-teal-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p className="text-4xl mb-2">📅</p>
            <p>Không có lịch hẹn nào hôm nay</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.map((apt) => (
              <div key={apt.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50">
                <div className="text-sm font-mono text-gray-500 w-14">
                  {apt.scheduledAt.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{apt.patient.fullName}</p>
                  <p className="text-xs text-gray-400">{apt.doctor.name} · {apt.type ?? "Khám bệnh"}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[apt.status]}`}
                >
                  {STATUS_LABELS[apt.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 hover:shadow-md transition-shadow ${color}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </Link>
  );
}
