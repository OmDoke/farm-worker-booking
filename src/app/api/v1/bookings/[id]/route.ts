import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';

export async function GET(
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

    const booking = await Booking.findById(bookingId)
      .populate('customer_id', 'name mobile_number address')
      .populate('worker_ids', 'name mobile_number');

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    // RBAC check
    if (authUser.role === 'customer' && booking.customer_id._id.toString() !== authUser.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (
      authUser.role === 'worker' &&
      !booking.worker_ids.some((w: { _id: { toString: () => string } }) => w._id.toString() === authUser.userId)
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Get Booking Detail Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch booking details' } },
      { status: 500 }
    );
  }
}
