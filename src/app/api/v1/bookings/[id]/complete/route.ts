import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { notifyJobCompleted } from '@/lib/notifications';

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

    if (!booking.worker_ids.some((wId) => wId.toString() === authUser.userId)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not assigned to this booking' } },
        { status: 403 }
      );
    }

    if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Booking must be confirmed or in_progress to be completed' } },
        { status: 400 }
      );
    }

    booking.status = 'completed';
    await booking.save();

    // Notify the customer that work is done (non-fatal)
    const populatedBooking = await Booking.findById(bookingId).populate('customer_id', 'mobile_number');
    const customerMobile = (populatedBooking?.customer_id as unknown as { mobile_number?: string })?.mobile_number;
    if (customerMobile) {
      notifyJobCompleted(customerMobile, bookingId).catch((err) =>
        console.error('Complete booking notification error:', err)
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Complete Booking Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to complete booking' } },
      { status: 500 }
    );
  }
}
