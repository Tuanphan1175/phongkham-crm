import crypto from "crypto";
import { format } from "date-fns";

interface VNPayParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  returnUrl?: string;
}

export function createVNPayUrl(params: VNPayParams): string {
  const tmnCode = process.env.VNPAY_TMN_CODE!;
  const hashSecret = process.env.VNPAY_HASH_SECRET!;
  const vnpUrl = process.env.VNPAY_URL!;
  const returnUrl = params.returnUrl ?? process.env.VNPAY_RETURN_URL!;

  const createDate = format(new Date(), "yyyyMMddHHmmss");

  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(params.amount * 100), // VNPay requires amount * 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: createDate,
  };

  const sortedParams = Object.keys(vnpParams)
    .sort()
    .reduce((acc, key) => {
      acc[key] = vnpParams[key];
      return acc;
    }, {} as Record<string, string>);

  const signData = new URLSearchParams(sortedParams).toString();

  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(signData, "utf-8").digest("hex");

  vnpParams.vnp_SecureHash = signed;

  return `${vnpUrl}?${new URLSearchParams(vnpParams).toString()}`;
}

export function verifyVNPayCallback(params: Record<string, string>): boolean {
  const hashSecret = process.env.VNPAY_HASH_SECRET!;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = params;

  const sortedParams = Object.keys(rest)
    .filter((k) => k.startsWith("vnp_"))
    .sort()
    .reduce((acc, key) => {
      acc[key] = rest[key];
      return acc;
    }, {} as Record<string, string>);

  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(signData, "utf-8").digest("hex");

  return signed === vnp_SecureHash;
}
