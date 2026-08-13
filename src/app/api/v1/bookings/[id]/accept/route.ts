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

    if (booking.status !== 'pending_assignment') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Booking cannot be accepted in its current state' } },
        { status: 400 }
      );
    }

    if (!booking.worker_ids.some((wId: any) => wId.toString() === authUser.userId)) {
      booking.worker_ids.push(authUser.userId as any);
    }
    booking.status = 'confirmed';
    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Accept Booking Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept booking' } },
      { status: 500 }
    );
  }
}
