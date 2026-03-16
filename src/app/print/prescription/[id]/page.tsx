import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PrintButton } from "../../PrintButton";

function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function PrintPrescriptionPage({ params }: { params: { id: string } }) {
  const rx = await db.prescription.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: { select: { name: true, phone: true } },
      items: { include: { medicine: true } },
    },
  });

  if (!rx) notFound();

  const age = rx.patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(rx.patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="print-page">
      {/* Clinic header */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "bold", textTransform: "uppercase" }}>
          Phòng Khám Bác Sĩ Chính Mình
        </h1>
        <p style={{ fontSize: "12px", marginTop: "2px" }}>
          Địa chỉ: _________________________ | ĐT: _________________________
        </p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
          ĐƠN THUỐC
        </h2>
        <p style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
          Số: {rx.id.slice(-8).toUpperCase()} &nbsp;|&nbsp; Ngày: {fmtDate(rx.issuedAt)}
        </p>
      </div>

      {/* Patient info */}
      <table style={{ marginBottom: "12px", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", paddingBottom: "4px" }}>
              <strong>Họ tên BN:</strong> {rx.patient.fullName}
            </td>
            <td style={{ width: "25%", paddingBottom: "4px" }}>
              <strong>Tuổi:</strong> {age ?? "____"}
            </td>
            <td style={{ width: "25%", paddingBottom: "4px" }}>
              <strong>Giới tính:</strong> {rx.patient.gender === "MALE" ? "Nam" : rx.patient.gender === "FEMALE" ? "Nữ" : "____"}
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: "4px" }}>
              <strong>Mã BN:</strong> {rx.patient.code}
            </td>
            <td colSpan={2} style={{ paddingBottom: "4px" }}>
              <strong>SĐT:</strong> {rx.patient.phone ?? "____"}
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ paddingBottom: "4px" }}>
              <strong>Địa chỉ:</strong> {rx.patient.address ?? "_________________________________________________"}
            </td>
          </tr>
          {rx.diagnosis && (
            <tr>
              <td colSpan={3} style={{ paddingBottom: "4px" }}>
                <strong>Chẩn đoán:</strong> {rx.diagnosis}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Medicine table */}
      <table className="border-table" style={{ marginBottom: "16px", fontSize: "12.5px" }}>
        <thead>
          <tr>
            <th style={{ width: "4%", textAlign: "center" }}>STT</th>
            <th style={{ width: "30%", textAlign: "left" }}>Tên thuốc</th>
            <th style={{ width: "8%", textAlign: "center" }}>ĐVT</th>
            <th style={{ width: "7%", textAlign: "center" }}>SL</th>
            <th style={{ width: "15%", textAlign: "center" }}>Liều dùng</th>
            <th style={{ width: "15%", textAlign: "center" }}>Tần suất</th>
            <th style={{ width: "11%", textAlign: "center" }}>Thời gian</th>
            <th style={{ width: "10%", textAlign: "center" }}>Cách dùng</th>
          </tr>
        </thead>
        <tbody>
          {rx.items.map((item, idx) => (
            <tr key={item.id}>
              <td style={{ textAlign: "center" }}>{idx + 1}</td>
              <td>
                <strong>{item.medicine.name}</strong>
                {item.medicine.concentration && (
                  <span style={{ color: "#555", fontSize: "11px" }}> ({item.medicine.concentration})</span>
                )}
                {item.medicine.dosageForm && (
                  <div style={{ fontSize: "11px", color: "#666" }}>{item.medicine.dosageForm}</div>
                )}
              </td>
              <td style={{ textAlign: "center" }}>{item.medicine.unit}</td>
              <td style={{ textAlign: "center", fontWeight: "bold" }}>{item.quantity}</td>
              <td style={{ textAlign: "center" }}>{item.dosage}</td>
              <td style={{ textAlign: "center" }}>{item.frequency}</td>
              <td style={{ textAlign: "center" }}>{item.duration}</td>
              <td style={{ textAlign: "center", fontSize: "11px" }}>{item.instructions ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes */}
      {rx.notes && (
        <p style={{ fontSize: "12px", marginBottom: "12px", fontStyle: "italic" }}>
          <strong>Lưu ý:</strong> {rx.notes}
        </p>
      )}

      {/* General instructions */}
      <div style={{ border: "1px solid #ccc", padding: "8px 12px", fontSize: "12px", marginBottom: "20px", background: "#fafafa" }}>
        <strong>Hướng dẫn sử dụng chung:</strong>
        <ul style={{ marginTop: "4px", paddingLeft: "16px" }}>
          <li>Uống thuốc đúng giờ, đúng liều, đủ ngày theo đơn</li>
          <li>Không tự ý dừng thuốc khi chưa hết đơn</li>
          <li>Tái khám đúng hẹn hoặc khi có triệu chứng bất thường</li>
        </ul>
      </div>

      {/* Signature */}
      <table style={{ marginTop: "8px" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", textAlign: "center", paddingTop: "0" }}>
              <p style={{ fontSize: "12px" }}>
                Ngày {new Date(rx.issuedAt).getDate()} tháng {new Date(rx.issuedAt).getMonth() + 1} năm {new Date(rx.issuedAt).getFullYear()}
              </p>
            </td>
            <td style={{ width: "50%", textAlign: "center" }}>
              <p style={{ fontSize: "12px" }}>&nbsp;</p>
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: "center" }}>
              <strong style={{ fontSize: "13px" }}>Bệnh nhân ký tên</strong>
              <p style={{ fontSize: "11px", color: "#555" }}>(Xác nhận đã nhận đơn thuốc)</p>
              <div style={{ height: "50px" }} />
              <p style={{ borderTop: "1px solid #000", display: "inline-block", paddingTop: "4px", minWidth: "120px", fontSize: "12px" }}>Ký tên</p>
            </td>
            <td style={{ textAlign: "center" }}>
              <strong style={{ fontSize: "13px" }}>Bác sĩ kê đơn</strong>
              <p style={{ fontSize: "11px", color: "#555" }}>BS. {rx.doctor.name}</p>
              <div style={{ height: "50px" }} />
              <p style={{ borderTop: "1px solid #000", display: "inline-block", paddingTop: "4px", minWidth: "120px", fontSize: "12px" }}>Ký & đóng dấu</p>
            </td>
          </tr>
        </tbody>
      </table>

      <PrintButton />
    </div>
  );
}
