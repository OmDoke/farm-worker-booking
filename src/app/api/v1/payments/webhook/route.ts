import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Payment } from '@/lib/models/Payment';
import { Booking } from '@/lib/models/Booking';
import { User } from '@/lib/models/User';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { notifyPaymentConfirmed } from '@/lib/notifications';

/**
 * POST /api/v1/payments/webhook
 *
 * Razorpay sends this when a payment is captured/failed.
 * - Verifies HMAC-SHA256 signature (dev: always passes with placeholder secret)
 * - Idempotent: the gateway_event_id is stored with a unique sparse index;
 *   a duplicate event will fail to insert and we return 200 OK (already processed)
 * - On success: marks Payment.status = paid, Booking.status = confirmed
 *
 * No auth header — webhook is validated by signature only.
 */
export async function POST(request: Request) {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_BODY', message: 'Could not read request body' } },
      { status: 400 }
    );
  }

  // Verify Razorpay signature
  const signature = request.headers.get('x-razorpay-signature') || '';
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' } },
      { status: 401 }
    );
  }

  let event: {
    event: string;
    payload: {
      payment?: { entity?: { order_id?: string; id?: string } };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Could not parse webhook payload' } },
      { status: 400 }
    );
  }

  // Only handle payment.captured events
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ success: true, data: { message: 'Event ignored' } });
  }

  const orderId = event.payload?.payment?.entity?.order_id;
  const razorpayPaymentId = event.payload?.payment?.entity?.id;

  if (!orderId || !razorpayPaymentId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PAYLOAD', message: 'Missing order_id or payment id in webhook' } },
      { status: 400 }
    );
  }

  await dbConnect();

  // Idempotency: attempt to record the gateway_event_id
  // If it already exists (duplicate delivery), MongoDB unique-index violation → skip
  const payment = await Payment.findOne({ gateway_reference: orderId });

  if (!payment) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Payment record not found for this order' } },
      { status: 404 }
    );
  }

  if (payment.gateway_event_id === razorpayPaymentId) {
    // Already processed — idempotent response
    return NextResponse.json({ success: true, data: { message: 'Already processed' } });
  }

  // Mark payment paid
  payment.status = 'paid';
  payment.gateway_event_id = razorpayPaymentId;
  payment.confirmed_at = new Date();
  await payment.save();

  // Move booking to confirmed
  const booking = await Booking.findByIdAndUpdate(
    payment.booking_id,
    { status: 'confirmed' },
    { new: true }
  ).populate('customer_id', 'mobile_number').populate('worker_ids', 'mobile_number');

  if (booking) {
    // Fire notifications (non-fatal)
    const customerMobile = (booking.customer_id as unknown as { mobile_number: string })?.mobile_number;
    const workerMobile = booking.worker_ids?.[0]
      ? (booking.worker_ids[0] as unknown as { mobile_number: string })?.mobile_number
      : null;

    if (customerMobile && workerMobile) {
      await notifyPaymentConfirmed(
        customerMobile,
        workerMobile,
        payment.booking_id.toString()
      ).catch((err) => console.error('Notify payment confirmed error:', err));
    }
  }

  return NextResponse.json({ success: true, data: { message: 'Payment confirmed' } });
}
