interface ZaloOAMessage {
  phone: string;       // Số điện thoại người nhận (đã liên kết Zalo)
  templateId: string;  // ID template ZNS
  templateData: Record<string, string>;
}

export async function sendZaloNotification(msg: ZaloOAMessage): Promise<boolean> {
  const accessToken = process.env.ZALO_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("Zalo OA access token not configured");
    return false;
  }

  const response = await fetch("https://business.openapi.zalo.me/message/template", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": accessToken,
    },
    body: JSON.stringify({
      phone: msg.phone,
      template_id: msg.templateId,
      template_data: msg.templateData,
      tracking_id: `phongkham_${Date.now()}`,
    }),
  });

  const data = await response.json();
  return data.error === 0;
}

// Gửi nhắc nhở check-in tuần gói 21 ngày
export async function sendWeeklyCheckinReminder({
  phone,
  patientName,
  weekNumber,
  programName,
}: {
  phone: string;
  patientName: string;
  weekNumber: number;
  programName: string;
}) {
  const templateId = process.env.ZALO_TEMPLATE_CHECKIN ?? "";
  return sendZaloNotification({
    phone,
    templateId,
    templateData: {
      patient_name: patientName,
      week_number: String(weekNumber),
      program_name: programName,
    },
  });
}

// Gửi nhắc lịch hẹn
export async function sendAppointmentReminder({
  phone,
  patientName,
  doctorName,
  dateTime,
}: {
  phone: string;
  patientName: string;
  doctorName: string;
  dateTime: string;
}) {
  const templateId = process.env.ZALO_TEMPLATE_APPOINTMENT ?? "";
  return sendZaloNotification({
    phone,
    templateId,
    templateData: {
      patient_name: patientName,
      doctor_name: doctorName,
      date_time: dateTime,
    },
  });
}
