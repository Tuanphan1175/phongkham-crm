import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

async function getPrescriptions(page: number) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const [prescriptions, total] = await Promise.all([
    db.prescription.findMany({
      include: {
        patient: { select: { fullName: true, code: true } },
        doctor: { select: { name: true } },
        items: true,
      },
      orderBy: { issuedAt: "desc" },
      skip,
      take: limit,
    }),
    db.prescription.count(),
  ]);
  return { prescriptions, total };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  DISPENSED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ cấp phát",
  DISPENSED: "Đã cấp phát",
  CANCELLED: "Đã hủy",
};

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? "1");
  const { prescriptions, total } = await getPrescriptions(page);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đơn thuốc</h1>
          <p className="text-sm text-gray-500">{total} đơn thuốc</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/medicines"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Kho thuốc
          </Link>
          <Link
            href="/prescriptions/new"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            + Kê đơn thuốc
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ngày kê</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bệnh nhân</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bác sĩ</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Chẩn đoán</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Số loại</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prescriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">Chưa có đơn thuốc</td>
              </tr>
            ) : (
              prescriptions.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.issuedAt)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{p.patient.fullName}</p>
                    <p className="text-xs text-gray-400">{p.patient.code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">BS. {p.doctor.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {p.diagnosis ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {p.items.length} loại
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/prescriptions/${p.id}`} className="text-sm text-teal-600 hover:underline">
                      Xem
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
