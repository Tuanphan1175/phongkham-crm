// SpeedSMS API integration
// Docs: https://speedsms.vn/tich-hop-sms-brandname/

interface SMSMessage {
  to: string;
  content: string;
}

export async function sendSMS(msg: SMSMessage): Promise<boolean> {
  const apiKey = process.env.SPEEDSMS_API_KEY;
  const sender = process.env.SPEEDSMS_SENDER;

  if (!apiKey || !sender) {
    console.warn("SMS credentials not configured");
    return false;
  }

  const credentials = Buffer.from(`${apiKey}:x`).toString("base64");

  const response = await fetch("https://api.speedsms.vn/index.php/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify({
      to: [msg.to],
      content: msg.content,
      type: 2, // 2 = Brandname advertising
      sender,
    }),
  });

  const data = await response.json();
  return data.status === "success";
}

export async function sendAppointmentSMS({
  phone,
  patientName,
  dateTime,
  clinicName = "Phòng Khám",
}: {
  phone: string;
  patientName: string;
  dateTime: string;
  clinicName?: string;
}) {
  const content = `${clinicName} nhac lich hen: Quy khach ${patientName} co lich kham luc ${dateTime}. Vui long den truoc 10 phut. LH: [SoDienThoai]`;
  return sendSMS({ to: phone, content });
}

export async function sendCheckinReminderSMS({
  phone,
  patientName,
  weekNumber,
}: {
  phone: string;
  patientName: string;
  weekNumber: number;
}) {
  const content = `Phong Kham: Xin chao ${patientName}! Tuan ${weekNumber} cua goi phuc hoi duong ruot 21 ngay da bat dau. Hay check-in va cap nhat chi so suc khoe. LH neu can ho tro.`;
  return sendSMS({ to: phone, content });
}
