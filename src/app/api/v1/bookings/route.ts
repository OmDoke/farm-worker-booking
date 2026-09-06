import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';

export async function POST(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'customer') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only customers can create bookings' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { farm_size_acres, processes, scheduled_date, farm_location_lat, farm_location_lng } = body;

    if (!farm_size_acres || !processes || processes.length === 0 || !scheduled_date) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'farm_size_acres, processes, and scheduled_date are required' } },
        { status: 400 }
      );
    }

    const date = new Date(scheduled_date);
    if (isNaN(date.getTime()) || date < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DATE', message: 'scheduled_date must be a valid future date' } },
        { status: 400 }
      );
    }

    await dbConnect();

    const booking = await Booking.create({
      customer_id: authUser.userId,
      farm_size_acres,
      processes,
      scheduled_date: date,
      status: 'pending_assignment',
      farm_location_lat,
      farm_location_lng,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Create Booking Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking' } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();

    let query = {};
    if (authUser.role === 'customer') {
      query = { customer_id: authUser.userId };
    } else if (authUser.role === 'worker') {
      // Per new dispatch workflow, workers only see jobs explicitly assigned to them
      query = { worker_ids: authUser.userId };
    }
    // admin gets all bookings

    const bookings = await Booking.find(query)
      .sort({ scheduled_date: 1 })
      .populate('customer_id', 'name mobile_number')
      .populate('worker_ids', 'name mobile_number');

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: unknown) {
    console.error('Get Bookings Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' } },
      { status: 500 }
    );
  }
}
