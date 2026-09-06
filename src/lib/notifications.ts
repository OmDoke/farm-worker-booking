/**
 * Notification helper — wraps MSG91 SMS delivery.
 *
 * In dev mode (placeholder auth key) all calls are logged to the console
 * and return immediately without hitting the SMS API.
 *
 * Replace MSG91_AUTH_KEY / MSG91_SENDER_ID / MSG91_TEMPLATE_ID in .env
 * with real values from https://msg91.com to enable live SMS.
 *
 * Idempotency: callers must ensure they only call notification functions
 * ONCE per lifecycle event (i.e. inside the same DB transaction/update that
 * changes the booking status). The functions themselves are stateless —
 * duplicate-send prevention is the responsibility of the caller.
 */

const AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const SENDER_ID = process.env.MSG91_SENDER_ID || 'FRMWRK';
const IS_PLACEHOLDER =
  AUTH_KEY === 'placeholder_msg91_key' || AUTH_KEY === '';

interface SmsPayload {
  to: string; // E.164 mobile number, e.g. +919876543210
  message: string;
}

async function sendSms({ to, message }: SmsPayload): Promise<void> {
  if (IS_PLACEHOLDER) {
    console.log(`[SMS DEV] To: ${to} | Message: ${message}`);
    return;
  }

  const url = 'https://api.msg91.com/api/v5/flow/';
  const body = JSON.stringify({
    template_id: process.env.MSG91_TEMPLATE_ID,
    short_url: '0',
    recipients: [{ mobiles: to.replace('+', ''), message }],
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: AUTH_KEY,
      origin: 'https://farm-worker-booking.vercel.app',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[SMS] Failed to send to ${to}: ${res.status} ${text}`);
    // Non-fatal — don't throw; booking lifecycle should not fail due to SMS error
  }
}

function formatMobile(mobile: string): string {
  // Ensure E.164 format with country code
  if (mobile.startsWith('+')) return mobile;
  return `+91${mobile}`;
}

// ── Lifecycle notification functions ──────────────────────────────────────────

export async function notifyBookingRequest(
  customerMobile: string,
  workerMobile: string,
  bookingId: string
): Promise<void> {
  await Promise.allSettled([
    sendSms({
      to: formatMobile(customerMobile),
      message: `Your farm worker booking (${bookingId}) has been submitted. We will notify you once a worker accepts.`,
    }),
    sendSms({
      to: formatMobile(workerMobile),
      message: `New booking request (${bookingId}). Please login to accept or decline.`,
    }),
  ]);
}

export async function notifyBookingAccepted(
  customerMobile: string,
  bookingId: string
): Promise<void> {
  await sendSms({
    to: formatMobile(customerMobile),
    message: `Great news! A worker has accepted your booking (${bookingId}). They will arrive on the scheduled date.`,
  });
}

export async function notifyPaymentConfirmed(
  customerMobile: string,
  workerMobile: string,
  bookingId: string
): Promise<void> {
  await Promise.allSettled([
    sendSms({
      to: formatMobile(customerMobile),
      message: `Payment confirmed for booking (${bookingId}). Thank you!`,
    }),
    sendSms({
      to: formatMobile(workerMobile),
      message: `Payment received for booking (${bookingId}).`,
    }),
  ]);
}

export async function notifyJobCompleted(
  customerMobile: string,
  bookingId: string
): Promise<void> {
  await sendSms({
    to: formatMobile(customerMobile),
    message: `Your farm work (${bookingId}) has been marked complete. Please rate your worker in the app.`,
  });
}
