import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PrintButton } from "../../PrintButton";

function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmt(v: number | string | null | undefined, unit = "") {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    return `${Number.isInteger(v) ? v : v.toFixed(1)}${unit ? " " + unit : ""}`;
  }
  return `${v}${unit ? " " + unit : ""}`;
}

const METRICS = [
  { key: "height",       label: "Chiều cao",          unit: "cm",   ref: "" },
  { key: "weight",       label: "Cân nặng",           unit: "kg",   ref: "" },
  { key: "bmi",          label: "BMI",                unit: "",     ref: "18 – 22.9" },
  { key: "bodyFatPct",   label: "Mỡ cơ thể",         unit: "%",    ref: "Nam: 10–20%\nNữ: 18–28%" },
  { key: "muscleMass",   label: "Khối cơ",            unit: "kg",   ref: "" },
  { key: "bodyShape",    label: "Vóc dáng",           unit: "",     ref: "1–3: Béo\n4–6: TB\n7–9: Gầy" },
  { key: "boneMass",     label: "Khối xương",         unit: "kg",   ref: "Nam: 2.5–3.2\nNữ: 1.8–2.5" },
  { key: "visceralFat",  label: "Mỡ nội tạng",       unit: "",     ref: "Nam<5 | Nữ<6" },
  { key: "bmr",          label: "BMR",                unit: "kcal", ref: "" },
  { key: "metabolicAge", label: "Tuổi sinh học",      unit: "tuổi", ref: "" },
  { key: "waterPct",     label: "Tỉ lệ nước",        unit: "%",    ref: "Nam: 50–65%\nNữ: 45–60%" },
  { key: "waistCirc",    label: "Vòng bụng",          unit: "cm",   ref: "" },
  { key: "bloodPressure",label: "Huyết áp",           unit: "",     ref: "≤120/80" },
  { key: "heartRate",    label: "Nhịp tim",           unit: "bpm",  ref: "60–100" },
];

export default async function PrintBodyMetricsPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = await db.patient.findUnique({
    where: { id: patientId },
    select: { id: true, fullName: true, code: true, gender: true, dateOfBirth: true, phone: true },
  });
  if (!patient) notFound();

  const rawMetrics = await db.bodyMetric.findMany({
    where: { patientId },
    orderBy: { recordedAt: "asc" },
  });

  let currentHeight: number | null = null;
  const metrics = rawMetrics.map(m => {
    const mCopy = { ...m };
    if (mCopy.height) currentHeight = mCopy.height;
    if (mCopy.weight && !mCopy.bmi && currentHeight) {
      mCopy.bmi = parseFloat((mCopy.weight / ((currentHeight / 100) ** 2)).toFixed(1));
    }
    return mCopy;
  });

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const today = new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="print-page">
      {/* Clinic header */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "8px", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "17px", fontWeight: "bold", textTransform: "uppercase" }}>
          Phòng Khám<br />BÁC SĨ CHÍNH MÌNH
        </h1>
        <p style={{ fontSize: "11px" }}>Địa chỉ: _________________________ | ĐT: _________________________</p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
          BẢNG THEO DÕI CHỈ SỐ CƠ THỂ
        </h2>
        <p style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>In ngày: {today}</p>
      </div>

      {/* Patient info */}
      <table style={{ marginBottom: "12px", fontSize: "12.5px" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", paddingBottom: "3px" }}>
              <strong>Họ tên:</strong> {patient.fullName}
            </td>
            <td style={{ paddingBottom: "3px" }}>
              <strong>Mã BN:</strong> {patient.code}
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: "3px" }}>
              <strong>Giới tính:</strong> {patient.gender === "MALE" ? "Nam" : patient.gender === "FEMALE" ? "Nữ" : "____"}
              &nbsp;&nbsp;&nbsp;
              <strong>Tuổi:</strong> {age ?? "____"}
            </td>
            <td style={{ paddingBottom: "3px" }}>
              <strong>SĐT:</strong> {patient.phone ?? "____"}
            </td>
          </tr>
        </tbody>
      </table>

      {metrics.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: "24px" }}>Chưa có dữ liệu đo</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="border-table" style={{ fontSize: "11.5px", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "110px" }} />
              <col style={{ width: "75px" }} />
              {metrics.map((_, i) => <col key={i} style={{ width: "68px" }} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: "left", background: "#e6f3f3" }}>Chỉ số</th>
                <th style={{ textAlign: "center", background: "#e6f3f3" }}>Tham chiếu</th>
                {metrics.map((m, i) => (
                  <th key={m.id} style={{ textAlign: "center", background: i === 0 ? "#d4edda" : "#e6f3f3" }}>
                    <div style={{ fontWeight: "bold" }}>LẦN {i + 1}</div>
                    <div style={{ fontWeight: "normal", fontSize: "10px" }}>{fmtDate(m.recordedAt)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric, rowIdx) => (
                <tr key={metric.key} style={{ background: rowIdx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ fontWeight: "600" }}>
                    {metric.label}
                    {metric.unit ? <span style={{ fontWeight: "normal", fontSize: "10px", color: "#666" }}> ({metric.unit})</span> : ""}
                  </td>
                  <td style={{ textAlign: "center", fontSize: "10px", color: "#555", whiteSpace: "pre-line", lineHeight: "1.3" }}>
                    {metric.ref || "—"}
                  </td>
                  {metrics.map((m, mIdx) => {
                    const val = (m as unknown as Record<string, unknown>)[metric.key];
                    const prev = mIdx > 0 ? (metrics[mIdx - 1] as unknown as Record<string, unknown>)[metric.key] : null;
                    const numVal = typeof val === "number" ? val : null;
                    const numPrev = typeof prev === "number" ? prev : null;
                    const diff = numVal !== null && numPrev !== null ? numVal - numPrev : null;

                    // For "bad" metrics (fat, visceral fat, waist, metabolic age, weight when high),
                    // going down is green; for "good" metrics (muscle, bone, water), going up is green.
                    const badMetrics = ["bodyFatPct", "visceralFat", "waistCirc", "metabolicAge"];
                    const isBad = badMetrics.includes(metric.key);
                    const changeColor = diff === null ? "" : diff > 0
                      ? (isBad ? "#c53030" : "#276749")
                      : (isBad ? "#276749" : "#c53030");
                    const arrow = diff === null ? "" : diff > 0 ? "▲" : "▼";

                    return (
                      <td key={m.id} style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: mIdx === 0 ? "bold" : "normal" }}>
                          {typeof val === "string" ? val : fmt(numVal, "")}
                        </div>
                        {diff !== null && diff !== 0 && (
                          <div style={{ fontSize: "10px", color: changeColor, fontWeight: "600" }}>
                            {arrow}{Math.abs(diff).toFixed(1)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Notes row */}
              <tr style={{ background: "#f5f5f5" }}>
                <td style={{ fontStyle: "italic", color: "#666" }}>Ghi chú</td>
                <td />
                {metrics.map(m => (
                  <td key={m.id} style={{ textAlign: "center", fontSize: "10px", color: "#555", fontStyle: "italic" }}>
                    {m.notes ?? ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: "12px", fontSize: "11px", color: "#555", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
        <strong>Chú thích:</strong>&nbsp;
        <span style={{ color: "#276749" }}>▲/▼ Xanh</span> = cải thiện &nbsp;|&nbsp;
        <span style={{ color: "#c53030" }}>▲/▼ Đỏ</span> = cần chú ý &nbsp;|&nbsp;
        Mỡ cơ thể/nội tạng/vòng bụng: giảm là tốt &nbsp;|&nbsp;
        Khối cơ/xương/tỉ lệ nước: tăng là tốt
      </div>

      {/* Consultant signature */}
      <table style={{ marginTop: "20px" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", textAlign: "center" }}>
              <strong style={{ fontSize: "12px" }}>Bệnh nhân xác nhận</strong>
              <div style={{ height: "45px" }} />
              <p style={{ borderTop: "1px solid #000", display: "inline-block", paddingTop: "3px", minWidth: "110px", fontSize: "11px" }}>Ký tên</p>
            </td>
            <td style={{ width: "50%", textAlign: "center" }}>
              <p style={{ fontSize: "11px" }}>Ngày {today}</p>
              <strong style={{ fontSize: "12px" }}>Tư vấn viên / Bác sĩ</strong>
              <div style={{ height: "45px" }} />
              <p style={{ borderTop: "1px solid #000", display: "inline-block", paddingTop: "3px", minWidth: "110px", fontSize: "11px" }}>Ký tên</p>
            </td>
          </tr>
        </tbody>
      </table>

      <PrintButton />
    </div>
  );
}
