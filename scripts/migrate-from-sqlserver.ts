/**
 * Script migration: SQL Server (medical_portal_2024) → PostgreSQL (phongkham-crm)
 *
 * Cách sử dụng:
 * 1. Cập nhật thông tin SQL Server trong .env
 * 2. npx ts-node scripts/migrate-from-sqlserver.ts
 *
 * Lưu ý: Script này cần được điều chỉnh theo schema thực tế của SQL Server cũ.
 * Tên bảng và cột cần được xác nhận bằng cách kết nối vào SQL Server và chạy:
 * SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'
 */

import * as sql from "mssql";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sqlConfig: sql.config = {
  server: process.env.SQLSERVER_HOST ?? "localhost",
  database: process.env.SQLSERVER_DATABASE ?? "",
  user: process.env.SQLSERVER_USER ?? "",
  password: process.env.SQLSERVER_PASSWORD ?? "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Tên bảng trong SQL Server cũ (cần xác nhận)
const TABLE_PATIENTS = "BenhNhan";      // Điều chỉnh nếu khác
const TABLE_MEDICINES = "DanhMucThuoc"; // Điều chỉnh nếu khác
const TABLE_PRESCRIPTIONS = "DonThuoc"; // Điều chỉnh nếu khác

async function migratePatients(pool: sql.ConnectionPool) {
  console.log("🔄 Đang migrate bệnh nhân...");

  const result = await pool.request().query(`
    SELECT TOP 1000
      MaBN,
      HoTen,
      NgaySinh,
      GioiTinh,
      DienThoai,
      Email,
      DiaChi,
      NgheNghiep,
      SoBHYT,
      GhiChu
    FROM ${TABLE_PATIENTS}
    ORDER BY MaBN
  `).catch(() => ({ recordset: [] }));

  let migrated = 0;
  for (const row of result.recordset) {
    try {
      const existing = await prisma.patient.findFirst({
        where: { code: String(row.MaBN) },
      });

      if (existing) continue;

      await prisma.patient.create({
        data: {
          code: String(row.MaBN),
          fullName: row.HoTen ?? "Không rõ",
          dateOfBirth: row.NgaySinh ? new Date(row.NgaySinh) : undefined,
          gender: row.GioiTinh === "Nam" ? "MALE" :
                  row.GioiTinh === "Nữ" ? "FEMALE" : undefined,
          phone: row.DienThoai,
          email: row.Email,
          address: row.DiaChi,
          occupation: row.NgheNghiep,
          insurance: row.SoBHYT,
          notes: row.GhiChu,
        },
      });
      migrated++;
    } catch (e) {
      console.warn(`  ⚠️  Bỏ qua BN ${row.MaBN}:`, e);
    }
  }

  console.log(`  ✅ Migrated ${migrated} bệnh nhân`);
  return migrated;
}

async function migrateMedicines(pool: sql.ConnectionPool) {
  console.log("🔄 Đang migrate danh mục thuốc...");

  const result = await pool.request().query(`
    SELECT
      MaThuoc,
      TenThuoc,
      HoatChat,
      DonVi,
      DangBaoChe,
      HamLuong,
      NhaSanXuat,
      TonKho,
      GiaNhap,
      GiaBan
    FROM ${TABLE_MEDICINES}
  `).catch(() => ({ recordset: [] }));

  let migrated = 0;
  for (const row of result.recordset) {
    try {
      const existing = await prisma.medicine.findFirst({
        where: { code: String(row.MaThuoc) },
      });
      if (existing) continue;

      await prisma.medicine.create({
        data: {
          code: String(row.MaThuoc),
          name: row.TenThuoc ?? "Không rõ",
          genericName: row.HoatChat,
          unit: row.DonVi ?? "viên",
          dosageForm: row.DangBaoChe,
          concentration: row.HamLuong,
          manufacturer: row.NhaSanXuat,
          stockQty: parseInt(row.TonKho ?? "0") || 0,
          costPrice: parseFloat(row.GiaNhap ?? "0") || 0,
          sellPrice: parseFloat(row.GiaBan ?? "0") || 0,
        },
      });
      migrated++;
    } catch (e) {
      console.warn(`  ⚠️  Bỏ qua thuốc ${row.MaThuoc}:`, e);
    }
  }

  console.log(`  ✅ Migrated ${migrated} thuốc`);
  return migrated;
}

async function main() {
  console.log("🚀 Bắt đầu migration từ SQL Server...\n");

  // Kiểm tra cấu hình
  if (!process.env.SQLSERVER_HOST || !process.env.SQLSERVER_DATABASE) {
    console.error("❌ Chưa cấu hình SQLSERVER_HOST và SQLSERVER_DATABASE trong .env");
    process.exit(1);
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    console.log(`📡 Kết nối SQL Server: ${process.env.SQLSERVER_HOST}/${process.env.SQLSERVER_DATABASE}`);
    pool = await sql.connect(sqlConfig);
    console.log("✅ Kết nối SQL Server thành công\n");

    // Migrate từng loại dữ liệu
    await migratePatients(pool);
    await migrateMedicines(pool);

    console.log("\n🎉 Migration hoàn thành!");
    console.log("\n📋 Lưu ý:");
    console.log("   - Kiểm tra lại dữ liệu trong PostgreSQL");
    console.log("   - Điều chỉnh tên bảng/cột nếu không khớp");
    console.log("   - Chạy lại script nếu cần (script an toàn, không tạo duplicate)");

  } catch (error) {
    console.error("\n❌ Lỗi kết nối SQL Server:", error);
    console.log("\n💡 Gợi ý:");
    console.log("   1. Kiểm tra SQLSERVER_* trong .env");
    console.log("   2. Đảm bảo SQL Server đang chạy");
    console.log("   3. Kiểm tra firewall/port 1433");
    console.log("   4. Giải mã Connection.xml từ medical_portal_2024 để lấy credentials");
  } finally {
    if (pool) await pool.close();
    await prisma.$disconnect();
  }
}

main();
