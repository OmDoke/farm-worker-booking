import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';

/**
 * POST /api/v1/bookings/:id/dispute
 *
 * Customer or worker raises a dispute on a booking.
 * Can be raised any time — including after completion or cancellation —
 * since disputes are usually raised after the fact.
 * dispute_status is tracked independently from booking.status per SRS v1.3 §3.5.
 *
 * Auth: JWT required (customer or worker)
 * Body: { reason: string }
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

    if (authUser.role === 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Use the admin resolve-dispute endpoint instead' } },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id: bookingId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'A dispute reason is required' } },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    // RBAC: customers can dispute their own bookings; workers dispute bookings they are assigned to
    const isCustomer =
      authUser.role === 'customer' &&
      booking.customer_id.toString() === authUser.userId;
    const isAssignedWorker =
      authUser.role === 'worker' &&
      booking.worker_ids.some((id) => id.toString() === authUser.userId);

    if (!isCustomer && !isAssignedWorker) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (booking.dispute_status === 'open') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_DISPUTED', message: 'A dispute is already open for this booking' } },
        { status: 409 }
      );
    }

    booking.dispute_status = 'open';
    booking.dispute_reason = reason.trim();
    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Raise Dispute Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to raise dispute' } },
      { status: 500 }
    );
  }
}
