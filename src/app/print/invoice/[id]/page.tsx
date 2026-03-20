import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PrintButton } from "../../PrintButton";

function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtCurrency(amount: number | string) {
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + " đ";
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Tiền mặt",
  MOMO: "MoMo",
  VNPAY: "VNPay",
  BANK_TRANSFER: "Chuyển khoản",
  INSURANCE: "Bảo hiểm y tế",
};

const STATUS_LABELS: Record<string, string> = {
  UNPAID: "CHƯA THANH TOÁN",
  PARTIAL: "THANH TOÁN MỘT PHẦN",
  PAID: "ĐÃ THANH TOÁN",
  REFUNDED: "ĐÃ HOÀN TIỀN",
  CANCELLED: "ĐÃ HỦY",
};

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await db.invoice.findUnique({
    where: { id },
    include: {
      patient: true,
      items: { include: { service: true } },
    },
  });

  if (!inv) notFound();

  const totalAmount = Number(inv.totalAmount);
  const discountAmount = Number(inv.discountAmount);
  const finalAmount = Number(inv.finalAmount);
  const paidAmount = Number(inv.paidAmount);
  const remaining = finalAmount - paidAmount;

  return (
    <div className="print-page">
      {/* Clinic header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "17px", fontWeight: "bold", textTransform: "uppercase" }}>
            Phòng Khám<br />BÁC SĨ CHÍNH MÌNH
          </h1>
          <p style={{ fontSize: "11px", marginTop: "2px" }}>Địa chỉ: _________________________</p>
          <p style={{ fontSize: "11px" }}>Điện thoại: _________________________</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "11px", color: "#555" }}>Mã HĐ: <strong>{inv.invoiceNumber}</strong></p>
          <p style={{ fontSize: "11px", color: "#555" }}>Ngày: {fmtDate(inv.createdAt)}</p>
          {inv.paidAt && <p style={{ fontSize: "11px", color: "#555" }}>Thanh toán: {fmtDate(inv.paidAt)}</p>}
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px" }}>
          HÓA ĐƠN DỊCH VỤ
        </h2>
      </div>

      {/* Patient info */}
      <table style={{ marginBottom: "14px", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={{ width: "60%", paddingBottom: "4px" }}>
              <strong>Họ tên:</strong> {inv.patient.fullName}
            </td>
            <td style={{ paddingBottom: "4px" }}>
              <strong>Mã BN:</strong> {inv.patient.code}
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: "4px" }}>
              <strong>Điện thoại:</strong> {inv.patient.phone ?? "____"}
            </td>
            <td style={{ paddingBottom: "4px" }}>
              <strong>BHYT:</strong> {inv.patient.insurance ?? "____"}
            </td>
          </tr>
          {inv.patient.address && (
            <tr>
              <td colSpan={2} style={{ paddingBottom: "4px" }}>
                <strong>Địa chỉ:</strong> {inv.patient.address}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Items table */}
      <table className="border-table" style={{ marginBottom: "8px", fontSize: "12.5px" }}>
        <thead>
          <tr>
            <th style={{ width: "5%", textAlign: "center" }}>STT</th>
            <th style={{ textAlign: "left" }}>Tên dịch vụ / Hàng hóa</th>
            <th style={{ width: "8%", textAlign: "center" }}>SL</th>
            <th style={{ width: "18%", textAlign: "right" }}>Đơn giá</th>
            <th style={{ width: "18%", textAlign: "right" }}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, idx) => (
            <tr key={item.id}>
              <td style={{ textAlign: "center" }}>{idx + 1}</td>
              <td>{item.description}</td>
              <td style={{ textAlign: "center" }}>{item.quantity}</td>
              <td style={{ textAlign: "right" }}>{fmtCurrency(Number(item.unitPrice))}</td>
              <td style={{ textAlign: "right", fontWeight: "500" }}>{fmtCurrency(Number(item.total))}</td>
            </tr>
          ))}
          {/* Spacer rows if few items */}
          {inv.items.length < 4 && Array.from({ length: 4 - inv.items.length }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td style={{ padding: "10px 8px" }}>&nbsp;</td>
              <td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <table style={{ marginBottom: "20px", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={{ width: "65%" }} />
            <td style={{ width: "20%", textAlign: "right", paddingBottom: "4px", color: "#555" }}>Tổng cộng:</td>
            <td style={{ width: "15%", textAlign: "right", paddingBottom: "4px" }}>{fmtCurrency(totalAmount)}</td>
          </tr>
          {discountAmount > 0 && (
            <tr>
              <td />
              <td style={{ textAlign: "right", paddingBottom: "4px", color: "#555" }}>Giảm giá:</td>
              <td style={{ textAlign: "right", paddingBottom: "4px", color: "#e53e3e" }}>- {fmtCurrency(discountAmount)}</td>
            </tr>
          )}
          <tr>
            <td />
            <td style={{ textAlign: "right", borderTop: "1px solid #000", paddingTop: "6px" }}>
              <strong>Thành tiền:</strong>
            </td>
            <td style={{ textAlign: "right", borderTop: "1px solid #000", paddingTop: "6px" }}>
              <strong style={{ fontSize: "15px" }}>{fmtCurrency(finalAmount)}</strong>
            </td>
          </tr>
          {paidAmount > 0 && paidAmount < finalAmount && (
            <>
              <tr>
                <td />
                <td style={{ textAlign: "right", paddingBottom: "2px", color: "#555" }}>Đã thanh toán:</td>
                <td style={{ textAlign: "right", paddingBottom: "2px" }}>{fmtCurrency(paidAmount)}</td>
              </tr>
              <tr>
                <td />
                <td style={{ textAlign: "right", color: "#c53030" }}>Còn lại:</td>
                <td style={{ textAlign: "right", color: "#c53030", fontWeight: "bold" }}>{fmtCurrency(remaining)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* Payment method + status */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "12.5px" }}>
        <div>
          {inv.paymentMethod && (
            <p><strong>Hình thức thanh toán:</strong> {PAYMENT_LABELS[inv.paymentMethod] ?? inv.paymentMethod}</p>
          )}
          {inv.paymentRef && (
            <p><strong>Mã giao dịch:</strong> {inv.paymentRef}</p>
          )}
          {inv.notes && <p style={{ marginTop: "4px", fontStyle: "italic" }}><strong>Ghi chú:</strong> {inv.notes}</p>}
        </div>
        <div style={{
          border: `2px solid ${inv.status === "PAID" ? "#2f855a" : "#c53030"}`,
          color: inv.status === "PAID" ? "#2f855a" : "#c53030",
          padding: "6px 16px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px",
          alignSelf: "flex-start", textTransform: "uppercase",
        }}>
          {STATUS_LABELS[inv.status]}
        </div>
      </div>

      {/* Signature */}
      <table>
        <tbody>
          <tr>
            <td style={{ width: "50%", textAlign: "center" }}>
              <strong style={{ fontSize: "13px" }}>Bệnh nhân</strong>
              <p style={{ fontSize: "11px", color: "#555" }}>(Ký, ghi rõ họ tên)</p>
              <div style={{ height: "50px" }} />
              <p style={{ borderTop: "1px solid #000", display: "inline-block", paddingTop: "4px", minWidth: "120px", fontSize: "12px" }}>Ký tên</p>
            </td>
            <td style={{ width: "50%", textAlign: "center" }}>
              <p style={{ fontSize: "12px" }}>
                Ngày {new Date(inv.createdAt).getDate()} tháng {new Date(inv.createdAt).getMonth() + 1} năm {new Date(inv.createdAt).getFullYear()}
              </p>
              <strong style={{ fontSize: "13px" }}>Người thu tiền</strong>
              <p style={{ fontSize: "11px", color: "#555" }}>(Ký, đóng dấu)</p>
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
