import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { notifyBookingAccepted } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser || authUser.role !== 'worker') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Worker access required' } },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id: bookingId } = await params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    if (booking.status !== 'pending_assignment') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Booking cannot be accepted in its current state' } },
        { status: 400 }
      );
    }

    if (!booking.worker_ids.some((wId: unknown) => (wId as { toString: () => string }).toString() === authUser.userId)) {
      booking.worker_ids.push(authUser.userId as unknown as import('mongoose').Types.ObjectId);
    }
    booking.status = 'confirmed';
    await booking.save();

    // Notify the customer that their booking was accepted (non-fatal)
    const populatedBooking = await Booking.findById(bookingId).populate('customer_id', 'mobile_number');
    const customerMobile = (populatedBooking?.customer_id as unknown as { mobile_number?: string })?.mobile_number;
    if (customerMobile) {
      notifyBookingAccepted(customerMobile, bookingId).catch((err) =>
        console.error('Accept booking notification error:', err)
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Accept Booking Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept booking' } },
      { status: 500 }
    );
  }
}
