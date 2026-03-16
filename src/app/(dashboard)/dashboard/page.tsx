import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalPatients, todayAppointments, activeEnrollments, monthRevenue] =
    await Promise.all([
      db.patient.count(),
      db.appointment.count({
        where: { scheduledAt: { gte: today, lt: tomorrow } },
      }),
      db.programEnrollment.count({ where: { status: "ACTIVE" } }),
      db.invoice.aggregate({
        where: { status: "PAID", paidAt: { gte: monthStart } },
        _sum: { finalAmount: true },
      }),
    ]);

  return {
    totalPatients,
    todayAppointments,
    activeEnrollments,
    monthRevenue: Number(monthRevenue._sum.finalAmount ?? 0),
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
  PENDING: "bg-amber-100 text-amber-800 border border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border border-blue-200",
  IN_PROGRESS: "bg-violet-100 text-violet-800 border border-violet-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  CANCELLED: "bg-red-100 text-red-700 border border-red-200",
  NO_SHOW: "bg-slate-100 text-slate-600 border border-slate-200",
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
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {session?.user.name}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng bệnh nhân" value={stats.totalPatients.toLocaleString("vi-VN")}
          icon="👥" href="/patients"
          bg="bg-blue-50" border="border-blue-200" text="text-blue-900" sub="text-blue-700" />
        <StatCard label="Lịch hẹn hôm nay" value={stats.todayAppointments.toString()}
          icon="📅" href="/appointments"
          bg="bg-teal-50" border="border-teal-200" text="text-teal-900" sub="text-teal-700" />
        <StatCard label="Gói 21 ngày đang chạy" value={stats.activeEnrollments.toString()}
          icon="🌿" href="/programs"
          bg="bg-emerald-50" border="border-emerald-200" text="text-emerald-900" sub="text-emerald-700" />
        <StatCard label="Doanh thu tháng này" value={formatCurrency(stats.monthRevenue)}
          icon="💰" href="/reports"
          bg="bg-amber-50" border="border-amber-200" text="text-amber-900" sub="text-amber-700" />
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Lịch hẹn hôm nay</h2>
          <Link href="/appointments" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
            Xem tất cả →
          </Link>
        </div>
        {appointments.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <p className="text-4xl mb-2">📅</p>
            <p className="text-sm">Không có lịch hẹn nào hôm nay</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {appointments.map((apt) => (
              <div key={apt.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="text-sm font-mono text-slate-500 w-14 shrink-0">
                  {apt.scheduledAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{apt.patient.fullName}</p>
                  <p className="text-xs text-slate-400">{apt.doctor.name}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${STATUS_COLORS[apt.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {STATUS_LABELS[apt.status] ?? apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/patients/new", label: "Thêm bệnh nhân", icon: "👤", color: "hover:border-blue-300 hover:bg-blue-50" },
          { href: "/appointments/new", label: "Đặt lịch hẹn", icon: "📅", color: "hover:border-teal-300 hover:bg-teal-50" },
          { href: "/prescriptions/new", label: "Kê đơn thuốc", icon: "💊", color: "hover:border-violet-300 hover:bg-violet-50" },
          { href: "/billing/new", label: "Tạo hóa đơn", icon: "🧾", color: "hover:border-amber-300 hover:bg-amber-50" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className={`bg-white border border-slate-200 rounded-xl p-4 text-center transition-all duration-150 shadow-sm ${item.color}`}>
            <div className="text-2xl mb-1.5">{item.icon}</div>
            <p className="text-sm font-semibold text-slate-700">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, href, bg, border, text, sub }: {
  label: string; value: string; icon: string; href: string;
  bg: string; border: string; text: string; sub: string;
}) {
  return (
    <Link href={href} className={`block rounded-xl border-2 p-5 hover:shadow-md transition-all duration-150 ${bg} ${border}`}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className={`text-xs font-medium mt-1.5 ${sub}`}>{label}</p>
    </Link>
  );
}
