import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { Payment } from '@/lib/models/Payment';
import { createRazorpayOrder } from '@/lib/razorpay';

/**
 * POST /api/v1/payments/initiate
 *
 * Called by the customer when payment_method = online.
 * Creates a Razorpay order, records a pending Payment, and returns
 * the order ID + UPI QR intent URL for the client to render.
 *
 * Auth: JWT required (role = customer)
 * Body: { booking_id: string, amount: number }
 */
export async function POST(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'customer') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Customer access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { booking_id, amount } = body;

    if (!booking_id || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'booking_id and a positive amount are required' } },
        { status: 400 }
      );
    }

    await dbConnect();

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    if (booking.customer_id.toString() !== authUser.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (booking.payment_method !== 'online') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_METHOD', message: 'Booking payment method is not online' } },
        { status: 400 }
      );
    }

    // Create Razorpay order (mocked in dev)
    const { order_id, qr_code_url } = await createRazorpayOrder(amount, booking_id);

    // Persist a pending Payment record
    const payment = await Payment.create({
      booking_id,
      method: 'online',
      amount,
      status: 'pending',
      gateway_reference: order_id,
      qr_code_url,
    });

    return NextResponse.json({
      success: true,
      data: {
        payment_id: payment._id,
        order_id,
        qr_code_url,
        amount,
        currency: 'INR',
      },
    });
  } catch (error: unknown) {
    console.error('Payment Initiate Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to initiate payment' } },
      { status: 500 }
    );
  }
}
