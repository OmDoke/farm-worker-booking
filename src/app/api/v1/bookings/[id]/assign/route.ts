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
    
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { worker_ids } = body;

    if (!worker_ids || !Array.isArray(worker_ids) || worker_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'worker_ids array is required' } },
        { status: 400 }
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
        { success: false, error: { code: 'INVALID_STATE', message: 'Booking is not pending assignment' } },
        { status: 400 }
      );
    }

    booking.worker_ids = worker_ids;
    // Status stays pending_assignment until the workers accept.
    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Assign Booking Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to assign booking' } },
      { status: 500 }
    );
  }
}
