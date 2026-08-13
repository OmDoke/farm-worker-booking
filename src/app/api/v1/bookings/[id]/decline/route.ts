import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';

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

    const workerIndex = booking.worker_ids.findIndex(
      (wId) => wId.toString() === authUser.userId
    );

    if (workerIndex === -1) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not assigned to this booking' } },
        { status: 403 }
      );
    }

    // Remove the worker
    booking.worker_ids.splice(workerIndex, 1);
    
    // If no workers left and it was confirmed, it should go back to pending
    if (booking.worker_ids.length === 0) {
      booking.status = 'pending_assignment';
    }

    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Decline Booking Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to decline booking' } },
      { status: 500 }
    );
  }
}
