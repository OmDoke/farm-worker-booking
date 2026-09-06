import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Payment } from '@/lib/models/Payment';
import { Booking } from '@/lib/models/Booking';
import { User } from '@/lib/models/User';
import { notifyPaymentConfirmed } from '@/lib/notifications';

/**
 * POST /api/v1/payments/:id/confirm-cash
 *
 * Worker or Admin confirms that cash has been collected.
 * - For cash_after_work: marks Payment.status = paid
 * - For cash_advance: marks Payment.status = paid AND
 *   moves Booking.status from awaiting_cash_confirmation → confirmed
 *
 * Auth: JWT required (role = worker OR admin). Customers are rejected with 403.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only worker or admin can confirm cash — customers cannot
    if (authUser.role === 'customer') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only workers or admins can confirm cash payments' } },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id: paymentId } = await params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } },
        { status: 404 }
      );
    }

    if (payment.method !== 'cash_after_work' && payment.method !== 'cash_advance') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_METHOD', message: 'confirm-cash only applies to cash_after_work or cash_advance payments' } },
        { status: 400 }
      );
    }

    if (payment.status === 'paid') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_CONFIRMED', message: 'Payment is already confirmed' } },
        { status: 409 }
      );
    }

    // Mark payment as paid
    payment.status = 'paid';
    payment.collected_by = authUser.userId as unknown as import('mongoose').Types.ObjectId;
    payment.confirmed_at = new Date();
    await payment.save();

    // For cash_advance: transition Booking from awaiting_cash_confirmation → confirmed
    let booking = null;
    if (payment.method === 'cash_advance') {
      booking = await Booking.findOneAndUpdate(
        {
          _id: payment.booking_id,
          status: 'awaiting_cash_confirmation',
        },
        { status: 'confirmed' },
        { returnDocument: 'after' }
      )
        .populate('customer_id', 'mobile_number')
        .populate('worker_ids', 'mobile_number');

    } else {
      booking = await Booking.findById(payment.booking_id)
        .populate('customer_id', 'mobile_number')
        .populate('worker_ids', 'mobile_number');
    }

    // Send notifications (non-fatal)
    if (booking) {
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

    return NextResponse.json({ success: true, data: { payment, booking } });
  } catch (error: unknown) {
    console.error('Confirm Cash Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm cash payment' } },
      { status: 500 }
    );
  }
}
