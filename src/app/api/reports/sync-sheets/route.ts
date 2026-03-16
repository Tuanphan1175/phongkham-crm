import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { google } from "googleapis";

function calcAge(dob: Date | null): string {
  if (!dob) return "";
  return String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)));
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { spreadsheetId: bodyId } = await req.json().catch(() => ({}));
  const spreadsheetId = bodyId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    return NextResponse.json({ error: "Chưa cấu hình Spreadsheet ID" }, { status: 400 });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    return NextResponse.json({ error: "Chưa cấu hình Google Service Account" }, { status: 400 });
  }

  // Fetch patients with latest medical record
  const patients = await db.patient.findMany({
    select: {
      fullName: true,
      dateOfBirth: true,
      phone: true,
      createdAt: true,
      medicalRecords: {
        select: { diagnosis: true, treatment: true, visitDate: true },
        orderBy: { visitDate: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build rows
  const header = ["Họ tên", "Tuổi", "Số điện thoại", "Chẩn đoán", "Hướng điều trị", "Ngày bắt đầu"];
  const rows = patients.map((p) => {
    const rec = p.medicalRecords[0];
    return [
      p.fullName,
      calcAge(p.dateOfBirth),
      p.phone ?? "",
      rec?.diagnosis ?? "",
      rec?.treatment ?? "",
      formatDate(rec?.visitDate ?? p.createdAt),
    ];
  });

  // Auth with Google
  const auth2 = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth: auth2 });

  // Get sheet info
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetName = meta.data.sheets?.[0]?.properties?.title ?? "Sheet1";

  // Clear & write
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A:F`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [header, ...rows] },
  });

  // Format header row bold
  const sheetId = meta.data.sheets?.[0]?.properties?.sheetId ?? 0;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.82, green: 0.94, blue: 0.93 } } },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 6 },
          },
        },
      ],
    },
  });

  return NextResponse.json({ success: true, rows: rows.length, spreadsheetId });
}
