import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate, GENDER_LABELS } from "@/lib/utils";

interface SearchParams {
  search?: string;
  page?: string;
}

async function getPatients(search: string, page: number) {
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    db.patient.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.patient.count({ where }),
  ]);

  return { patients, total, pages: Math.ceil(total / limit) };
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { search: searchParam, page: pageParam } = await searchParams;
  const search = searchParam ?? "";
  const page = parseInt(pageParam ?? "1");
  const { patients, total, pages } = await getPatients(search, page);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bệnh nhân</h1>
          <p className="text-sm text-gray-500">{total} bệnh nhân</p>
        </div>
        <Link
          href="/patients/new"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          + Thêm bệnh nhân
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Tìm kiếm theo tên, mã BN, SĐT..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          Tìm
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mã BN</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ngày sinh</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Giới tính</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Điện thoại</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  {search ? "Không tìm thấy bệnh nhân" : "Chưa có bệnh nhân nào"}
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.code}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{p.fullName}</p>
                    {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.dateOfBirth ? formatDate(p.dateOfBirth) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.gender ? GENDER_LABELS[p.gender] : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/patients/${p.id}`}
                      className="text-sm text-teal-600 hover:underline"
                    >
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Trang {page} / {pages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/patients?search=${search}&page=${page - 1}`}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  ← Trước
                </Link>
              )}
              {page < pages && (
                <Link
                  href={`/patients?search=${search}&page=${page + 1}`}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Sau →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
