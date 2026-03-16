import crypto from "crypto";

interface MoMoPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl?: string;
  ipnUrl?: string;
}

interface MoMoPaymentResult {
  payUrl: string;
  orderId: string;
  requestId: string;
}

export async function createMoMoPayment(params: MoMoPaymentParams): Promise<MoMoPaymentResult> {
  const partnerCode = process.env.MOMO_PARTNER_CODE!;
  const accessKey = process.env.MOMO_ACCESS_KEY!;
  const secretKey = process.env.MOMO_SECRET_KEY!;
  const endpoint = process.env.MOMO_ENDPOINT!;
  const redirectUrl = params.redirectUrl ?? process.env.MOMO_REDIRECT_URL!;
  const ipnUrl = params.ipnUrl ?? process.env.MOMO_IPN_URL!;

  const requestId = `${partnerCode}${Date.now()}`;
  const orderId = params.orderId;
  const requestType = "payWithMethod";
  const extraData = "";
  const autoCapture = true;
  const lang = "vi";

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${params.amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${params.orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join("&");

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    partnerName: "Phòng Khám CRM",
    storeId: partnerCode,
    requestId,
    amount: params.amount,
    orderId,
    orderInfo: params.orderInfo,
    redirectUrl,
    ipnUrl,
    lang,
    requestType,
    autoCapture,
    extraData,
    signature,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (data.resultCode !== 0) {
    throw new Error(`MoMo error: ${data.message}`);
  }

  return {
    payUrl: data.payUrl,
    orderId: data.orderId,
    requestId: data.requestId,
  };
}

export function verifyMoMoCallback(params: Record<string, string>): boolean {
  const secretKey = process.env.MOMO_SECRET_KEY!;
  const { signature, ...rest } = params;

  const rawSignature = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return signature === expectedSignature;
}
