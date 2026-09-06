/**
 * Razorpay helper
 *
 * In dev/test (when RAZORPAY_KEY_ID is the placeholder), all calls are mocked
 * so the build and tests pass without real credentials.
 * Replace the placeholder values in .env with real Razorpay keys to go live.
 */
import crypto from 'crypto';

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const IS_PLACEHOLDER =
  KEY_ID === 'rzp_test_placeholder' || KEY_ID === '' || KEY_SECRET === 'placeholder_secret';

export interface RazorpayOrderResult {
  order_id: string;
  amount: number; // paise
  currency: string;
  qr_code_url: string;
}

/**
 * Creates a Razorpay order and returns the order ID plus a UPI QR intent URL.
 * In dev mode (placeholder keys) returns a mock result.
 */
export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string
): Promise<RazorpayOrderResult> {
  if (IS_PLACEHOLDER) {
    const fakeOrderId = `order_mock_${Date.now()}`;
    return {
      order_id: fakeOrderId,
      amount: amountInRupees * 100,
      currency: 'INR',
      qr_code_url: `upi://pay?pa=mock@upi&pn=FarmWorker&am=${amountInRupees}&tr=${fakeOrderId}&tn=FarmBookingPayment`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  const instance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

  const order = await instance.orders.create({
    amount: amountInRupees * 100, // Razorpay works in paise
    currency: 'INR',
    receipt,
    payment_capture: 1,
  });

  // Build a UPI deep-link QR intent from the order
  const upiQr = `upi://pay?pa=${KEY_ID}@razorpay&pn=FarmWorkerBooking&am=${amountInRupees}&tr=${order.id}&tn=FarmBookingPayment`;

  return {
    order_id: order.id as string,
    amount: order.amount as number,
    currency: order.currency as string,
    qr_code_url: upiQr,
  };
}

/**
 * Verifies a Razorpay webhook signature.
 * Returns true if the payload matches the expected HMAC-SHA256 signature.
 * In dev mode (placeholder secret) always returns true so tests can run.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (WEBHOOK_SECRET === 'placeholder_webhook_secret' || WEBHOOK_SECRET === '') {
    return true; // dev/test mode — skip verification
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}
