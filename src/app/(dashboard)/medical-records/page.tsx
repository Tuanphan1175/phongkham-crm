"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Patient { id: string; fullName: string; code: string; }
interface MedicalRecord {
  id: string;
  visitDate: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  treatment: string | null;
  vitalSigns: Record<string, string> | null;
  labResults: string | null;
  imagingResults: string | null;
  notes: string | null;
  followUpDate: string | null;
  patient: { id: string; fullName: string; code: string };
  doctor: { id: string; name: string };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function MedicalRecordsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const url = patientId ? `/api/medical-records?patientId=${patientId}` : `/api/medical-records`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setRecords(data.records);
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchRecords();
    if (patientId) {
      fetch(`/api/patients/${patientId}`)
        .then(r => r.json())
        .then(d => { if (d?.id) setPatient(d); })
        .catch(() => {});
    }
  }, [fetchRecords, patientId]);

  const newRecordHref = patientId
    ? `/medical-records/new?patientId=${patientId}`
    : "/medical-records/new";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Bệnh Án</h1>
          {patient && (
            <p className="text-sm text-slate-500 mt-0.5">
              {patient.fullName} · <span className="font-mono">{patient.code}</span>
              <Link href={`/patients/${patient.id}`} className="ml-2 text-teal-600 hover:underline text-xs">
                → Hồ sơ bệnh nhân
              </Link>
            </p>
          )}
        </div>
        <Link
          href={newRecordHref}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm bệnh án
        </Link>
      </div>

      {/* Records list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">Đang tải bệnh án...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-slate-600">Chưa có bệnh án nào</p>
          <Link
            href={newRecordHref}
            className="mt-4 inline-block text-sm text-teal-600 hover:underline"
          >
            + Tạo bệnh án đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const vs = rec.vitalSigns;
            return (
              <div key={rec.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold text-slate-800">
                          {formatDate(rec.visitDate)}
                        </span>
                        {!patientId && (
                          <span className="text-sm text-slate-600 font-medium">
                            {rec.patient.fullName}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">· {rec.doctor.name}</span>
                      </div>
                      {rec.chiefComplaint && (
                        <p className="text-sm text-slate-600 truncate">
                          <span className="text-slate-400">Lý do: </span>{rec.chiefComplaint}
                        </p>
                      )}
                      {rec.diagnosis && (
                        <p className="text-sm font-medium text-teal-700 truncate mt-0.5">
                          <span className="text-slate-400 font-normal">Chẩn đoán: </span>{rec.diagnosis}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rec.followUpDate && (
                        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          Tái khám: {formatDate(rec.followUpDate)}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50">
                    {vs && Object.values(vs).some(v => v) && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sinh hiệu</p>
                        <div className="flex flex-wrap gap-3">
                          {vs.pulse && <VitalBadge label="Mạch" value={`${vs.pulse} l/p`} />}
                          {vs.temperature && <VitalBadge label="Nhiệt độ" value={`${vs.temperature}°C`} />}
                          {vs.bloodPressure && <VitalBadge label="Huyết áp" value={vs.bloodPressure} />}
                          {vs.spo2 && <VitalBadge label="SpO2" value={`${vs.spo2}%`} />}
                          {vs.weight && <VitalBadge label="Cân nặng" value={`${vs.weight} kg`} />}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rec.chiefComplaint && (
                        <DetailRow label="Lý do khám" value={rec.chiefComplaint} />
                      )}
                      {rec.diagnosis && (
                        <DetailRow label="Chẩn đoán" value={rec.diagnosis} highlight />
                      )}
                      {rec.treatment && (
                        <DetailRow label="Hướng điều trị" value={rec.treatment} className="md:col-span-2" />
                      )}
                      {rec.labResults && (
                        <DetailRow label="Kết quả xét nghiệm" value={rec.labResults} />
                      )}
                      {rec.imagingResults && (
                        <DetailRow label="Kết quả hình ảnh" value={rec.imagingResults} />
                      )}
                      {rec.notes && (
                        <DetailRow label="Ghi chú" value={rec.notes} className="md:col-span-2" />
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/medical-records/new?patientId=${rec.patient.id}`}
                        className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100"
                      >
                        + Bệnh án mới
                      </Link>
                      <Link
                        href={`/prescriptions/new?patientId=${rec.patient.id}`}
                        className="text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100"
                      >
                        💊 Kê đơn
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VitalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function DetailRow({ label, value, highlight, className }: {
  label: string; value: string; highlight?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${highlight ? "text-teal-800 font-medium" : "text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}
