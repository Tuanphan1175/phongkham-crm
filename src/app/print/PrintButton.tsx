"use client";

export function PrintButton() {
  return (
    <div className="no-print" style={{ textAlign: "center", padding: "16px", borderTop: "1px dashed #ccc", marginTop: "24px" }}>
      <button
        onClick={() => window.print()}
        style={{
          background: "#0d9488", color: "white", border: "none",
          padding: "10px 28px", borderRadius: "6px", fontSize: "14px",
          cursor: "pointer", fontFamily: "sans-serif", marginRight: "10px",
        }}
      >
        🖨️ In / Lưu PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{
          background: "#f5f5f5", color: "#555", border: "1px solid #ddd",
          padding: "10px 20px", borderRadius: "6px", fontSize: "14px",
          cursor: "pointer", fontFamily: "sans-serif",
        }}
      >
        Đóng
      </button>
    </div>
  );
}
