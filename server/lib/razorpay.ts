import Razorpay from "razorpay";
import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  if (razorpayInstance) return razorpayInstance;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.",
    );
    return null;
  }

  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  return razorpayInstance;
}

export function getRazorpayKeyId(): string {
  return RAZORPAY_KEY_ID;
}

/**
 * Verifies the signature Razorpay returns to the client after a successful
 * checkout (order_id + payment_id + key_secret, HMAC-SHA256).
 * This MUST pass before we ever mark a payment as successful.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return expectedSignature === params.signature;
}

/**
 * Verifies the signature on incoming Razorpay webhook payloads
 * (X-Razorpay-Signature header, HMAC-SHA256 over the raw request body).
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook.");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

// Razorpay expects amounts in the smallest currency unit (paise for INR).
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
