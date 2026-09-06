import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { writeAuditLog } from '@/lib/models/AuditLog';

/**
 * POST /api/v1/bookings/:id/cancel
 *
 * Customer, worker, or admin cancels a booking with a reason.
 * Cannot cancel a completed booking.
 *
 * Auth: JWT required (any role)
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

    await dbConnect();
    const { id: bookingId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'A cancellation reason is required' } },
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

    // RBAC: customers can only cancel own bookings
    if (
      authUser.role === 'customer' &&
      booking.customer_id.toString() !== authUser.userId
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Workers can only cancel bookings they are assigned to
    if (
      authUser.role === 'worker' &&
      !booking.worker_ids.some((id) => id.toString() === authUser.userId)
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Cannot cancel a completed booking' } },
        { status: 400 }
      );
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_CANCELLED', message: 'Booking is already cancelled' } },
        { status: 409 }
      );
    }

    booking.status = 'cancelled';
    booking.cancellation_reason = reason.trim();
    booking.cancelled_at = new Date();
    await booking.save();

    await writeAuditLog(authUser.userId, 'cancel_booking', 'Booking', bookingId, {
      reason,
      cancelled_by_role: authUser.role,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Cancel Booking Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel booking' } },
      { status: 500 }
    );
  }
}
