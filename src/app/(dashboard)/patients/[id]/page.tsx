import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime, GENDER_LABELS, APPOINTMENT_STATUS_LABELS } from "@/lib/utils";
import Link from "next/link";

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const patient = await db.patient.findUnique({
    where: { id: params.id },
    include: {
      appointments: {
        include: { doctor: true },
        orderBy: { scheduledAt: "desc" },
        take: 5,
      },
      medicalRecords: {
        include: { doctor: true },
        orderBy: { visitDate: "desc" },
        take: 5,
      },
      prescriptions: {
        include: { items: { include: { medicine: true } }, doctor: true },
        orderBy: { issuedAt: "desc" },
        take: 5,
      },
      programEnrollments: {
        include: { program: true },
        orderBy: { startDate: "desc" },
      },
      bodyMetrics: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!patient) notFound();

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patients" className="text-sm text-gray-400 hover:text-gray-600">
            ← Danh sách bệnh nhân
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{patient.fullName}</h1>
          <p className="text-sm text-gray-500 font-mono">{patient.code}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/appointments/new?patientId=${patient.id}`}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            + Đặt lịch hẹn
          </Link>
          <Link
            href={`/programs/new?patientId=${patient.id}`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            + Đăng ký gói
          </Link>
          <Link
            href={`/patients/${patient.id}/body-metrics`}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            📊 Chỉ số cơ thể
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Patient info card */}
        <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Thông tin bệnh nhân</h2>
          <dl className="space-y-3">
            <InfoRow label="Họ tên" value={patient.fullName} />
            <InfoRow label="Mã BN" value={patient.code} mono />
            <InfoRow
              label="Ngày sinh"
              value={patient.dateOfBirth
                ? `${formatDate(patient.dateOfBirth)}${age ? ` (${age} tuổi)` : ""}`
                : "—"
              }
            />
            <InfoRow label="Giới tính" value={patient.gender ? GENDER_LABELS[patient.gender] : "—"} />
            <InfoRow label="Điện thoại" value={patient.phone ?? "—"} />
            <InfoRow label="Email" value={patient.email ?? "—"} />
            <InfoRow label="Địa chỉ" value={patient.address ?? "—"} />
            <InfoRow label="Nghề nghiệp" value={patient.occupation ?? "—"} />
            <InfoRow label="Số BHYT" value={patient.insurance ?? "—"} />
            {patient.notes && <InfoRow label="Ghi chú" value={patient.notes} />}
          </dl>
        </div>

        <div className="col-span-2 space-y-4">
          {/* Appointments */}
          <SectionCard
            title="Lịch hẹn gần đây"
            linkHref={`/appointments?patientId=${patient.id}`}
            empty={patient.appointments.length === 0}
            emptyText="Chưa có lịch hẹn"
          >
            {patient.appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(apt.scheduledAt)}
                  </p>
                  <p className="text-xs text-gray-400">{apt.doctor.name} · {apt.type ?? "Khám bệnh"}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {APPOINTMENT_STATUS_LABELS[apt.status]}
                </span>
              </div>
            ))}
          </SectionCard>

          {/* Medical records */}
          <SectionCard
            title="Bệnh án gần đây"
            linkHref={`/medical-records?patientId=${patient.id}`}
            empty={patient.medicalRecords.length === 0}
            emptyText="Chưa có bệnh án"
          >
            {patient.medicalRecords.map((rec) => (
              <div key={rec.id} className="py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">{formatDate(rec.visitDate)}</p>
                  <p className="text-xs text-gray-400">{rec.doctor.name}</p>
                </div>
                {rec.diagnosis && (
                  <p className="text-xs text-gray-600 mt-0.5">Chẩn đoán: {rec.diagnosis}</p>
                )}
              </div>
            ))}
          </SectionCard>

          {/* Program enrollments */}
          {patient.programEnrollments.length > 0 && (
            <SectionCard
              title="Gói liệu trình"
              linkHref={`/programs?patientId=${patient.id}`}
              empty={false}
            >
              {patient.programEnrollments.map((enr) => (
                <Link
                  key={enr.id}
                  href={`/programs/${enr.id}`}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-4 px-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{enr.program.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(enr.startDate)} → {formatDate(enr.endDate)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    enr.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                    enr.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {enr.status === "ACTIVE" ? "Đang chạy" :
                     enr.status === "COMPLETED" ? "Hoàn thành" : enr.status}
                  </span>
                </Link>
              ))}
            </SectionCard>
          )}

          {/* Body metrics summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">📊 Chỉ số cơ thể</h3>
              <Link
                href={`/patients/${patient.id}/body-metrics`}
                className="text-xs text-purple-600 hover:underline"
              >
                Xem & nhập chỉ số →
              </Link>
            </div>
            {patient.bodyMetrics.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-2">Chưa có chỉ số nào</p>
                <Link
                  href={`/patients/${patient.id}/body-metrics`}
                  className="inline-block text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                >
                  + Nhập chỉ số đầu tiên
                </Link>
              </div>
            ) : (() => {
              const bm = patient.bodyMetrics[0];
              const date = new Date(bm.recordedAt).toLocaleDateString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric"
              });
              return (
                <div>
                  <p className="text-xs text-gray-400 mb-3">Lần đo gần nhất: {date}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Cân nặng", value: bm.weight ? `${bm.weight} kg` : "—" },
                      { label: "BMI", value: bm.bmi ? String(bm.bmi) : "—" },
                      { label: "Mỡ cơ thể", value: bm.bodyFatPct ? `${bm.bodyFatPct}%` : "—" },
                      { label: "Khối cơ", value: bm.muscleMass ? `${bm.muscleMass} kg` : "—" },
                      { label: "Mỡ nội tạng", value: bm.visceralFat ? String(bm.visceralFat) : "—" },
                      { label: "Huyết áp", value: bm.bloodPressure ?? "—" },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-gray-400">{item.label}</div>
                        <div className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className={`text-sm text-gray-900 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function SectionCard({
  title,
  linkHref,
  children,
  empty,
  emptyText,
}: {
  title: string;
  linkHref: string;
  children?: React.ReactNode;
  empty: boolean;
  emptyText?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Link href={linkHref} className="text-xs text-teal-600 hover:underline">
          Xem tất cả
        </Link>
      </div>
      {empty ? (
        <p className="text-sm text-gray-400 py-4 text-center">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  );
}
