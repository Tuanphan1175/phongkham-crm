import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
import { DispenseButton } from "./DispenseButton";
import { ReturnMedicineButton } from "./ReturnMedicineButton";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  DISPENSED: "bg-green-100 text-green-700 border border-green-200",
  CANCELLED: "bg-gray-100 text-gray-500 border border-gray-200",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ cấp phát",
  DISPENSED: "Đã cấp phát",
  CANCELLED: "Đã hủy",
};

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prescription = await db.prescription.findUnique({
    where: { id },
    include: {
      patient: {
        select: { id: true, fullName: true, code: true, phone: true, dateOfBirth: true, gender: true },
      },
      doctor: { select: { name: true } },
      items: {
        include: {
          medicine: {
            select: { name: true, unit: true, concentration: true, dosageForm: true, sellPrice: true },
          },
        },
      },
    },
  });

  if (!prescription) notFound();

  const medicineTotal = prescription.items.reduce(
    (sum, item) => sum + item.quantity * Number(item.medicine.sellPrice ?? 0),
    0
  );
  const hasPrice = prescription.items.some(it => Number(it.medicine.sellPrice ?? 0) > 0);

  const age = prescription.patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(prescription.patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/prescriptions" className="text-sm text-gray-400 hover:text-gray-600">
            ← Danh sách đơn thuốc
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Đơn thuốc</h1>
          <p className="text-sm text-gray-400 font-mono">#{prescription.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[prescription.status]}`}>
            {STATUS_LABELS[prescription.status]}
          </span>
          {prescription.status !== "CANCELLED" && (
            <div className="flex items-center gap-2">
              <ReturnMedicineButton id={prescription.id} />
              {prescription.status === "PENDING" && (
                <DispenseButton id={prescription.id} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Patient + Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bệnh nhân</h2>
          <div className="space-y-1.5">
            <p className="font-semibold text-gray-900">{prescription.patient.fullName}</p>
            <p className="text-sm text-gray-500 font-mono">{prescription.patient.code}</p>
            {age && <p className="text-sm text-gray-500">{age} tuổi</p>}
            {prescription.patient.phone && (
              <p className="text-sm text-gray-500">📞 {prescription.patient.phone}</p>
            )}
            <Link
              href={`/patients/${prescription.patient.id}`}
              className="inline-block text-xs text-teal-600 hover:underline mt-1"
            >
              Xem hồ sơ →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Thông tin đơn</h2>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-400">Ngày kê:</span>
              <p className="text-sm text-gray-800">{formatDate(prescription.issuedAt)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Bác sĩ:</span>
              <p className="text-sm text-gray-800">BS. {prescription.doctor.name}</p>
            </div>
            {prescription.diagnosis && (
              <div>
                <span className="text-xs text-gray-400">Chẩn đoán:</span>
                <p className="text-sm text-gray-800">{prescription.diagnosis}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medicine items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Danh sách thuốc ({prescription.items.length} loại)</h2>
          {hasPrice && (
            <span className="text-sm text-gray-500">
              Tổng tiền thuốc: <strong className="text-teal-700">{formatCurrency(medicineTotal)}</strong>
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {prescription.items.map((item, idx) => {
            const lineTotal = item.quantity * Number(item.medicine.sellPrice ?? 0);
            return (
              <div key={item.id} className="px-5 py-4 flex gap-4">
                <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-teal-700 font-bold text-sm shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {item.medicine.name}
                      {item.medicine.concentration && (
                        <span className="font-normal text-gray-500 ml-1">({item.medicine.concentration})</span>
                      )}
                    </p>
                    {hasPrice && (
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(lineTotal)}</p>
                        {item.medicine.sellPrice ? (
                          <p className="text-xs text-gray-400">{item.quantity} × {formatCurrency(Number(item.medicine.sellPrice))}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {item.medicine.dosageForm && (
                    <p className="text-xs text-gray-400">{item.medicine.dosageForm}</p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span><span className="text-gray-400">Số lượng:</span> {item.quantity} {item.medicine.unit}</span>
                    <span><span className="text-gray-400">Liều dùng:</span> {item.dosage}</span>
                    <span><span className="text-gray-400">Tần suất:</span> {item.frequency}</span>
                    <span><span className="text-gray-400">Thời gian:</span> {item.duration}</span>
                  </div>
                  {item.instructions && (
                    <p className="mt-1.5 text-sm text-blue-700 bg-blue-50 rounded-md px-3 py-1.5">
                      💡 {item.instructions}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {hasPrice && (
          <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-between items-center">
            <span className="text-sm text-gray-500">Tổng tiền thuốc</span>
            <span className="text-base font-bold text-teal-700">{formatCurrency(medicineTotal)}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {prescription.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-1">Ghi chú</h3>
          <p className="text-sm text-amber-700">{prescription.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {hasPrice && (
          <Link
            href={`/billing/new?prescriptionId=${prescription.id}`}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
          >
            🧾 Tạo hóa đơn thuốc
          </Link>
        )}
        <Link
          href={`/print/prescription/${prescription.id}`}
          target="_blank"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
        >
          🖨️ In đơn thuốc
        </Link>
        <Link
          href={`/prescriptions/new?patientId=${prescription.patient.id}`}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          + Kê đơn mới
        </Link>
        <Link
          href={`/patients/${prescription.patient.id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Hồ sơ bệnh nhân
        </Link>
      </div>
    </div>
  );
}

