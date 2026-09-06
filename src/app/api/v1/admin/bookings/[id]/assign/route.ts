import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { BookingAssignment } from '@/lib/models/BookingAssignment';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { writeAuditLog } from '@/lib/models/AuditLog';
import { getSetting } from '@/lib/models/PlatformSettings';
import { notifyBookingAccepted, notifyWorkerAssigned } from '@/lib/notifications';

/**
 * POST /api/v1/admin/bookings/:id/assign
 *
 * Admin assigns or reassigns a specific open assignment slot to a worker.
 * Body: { worker_id: string, assignment_id?: string }
 *   - If assignment_id is provided, assigns that specific slot.
 *   - Otherwise, takes the first open slot on the booking.
 *
 * Auth: JWT required (role = admin)
 */
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

    await dbConnect();
    const { id: bookingId } = await params;
    const body = await request.json();
    const { worker_id, assignment_id } = body;

    if (!worker_id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'worker_id is required' } },
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

    // Verify worker is approved
    const workerProfile = await WorkerProfile.findOne({ user_id: worker_id, is_verified: true });
    if (!workerProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_WORKER', message: 'Worker not found or not verified' } },
        { status: 400 }
      );
    }

    // Add worker to booking.worker_ids if not already there
    if (!booking.worker_ids.some((id) => id.toString() === worker_id)) {
      booking.worker_ids.push(worker_id as unknown as import('mongoose').Types.ObjectId);
    }
    
    // Per new dispatch flow: assigning a worker instantly confirms the booking
    booking.status = 'confirmed';
    await booking.save();

    await writeAuditLog(authUser.userId, 'assign_booking', 'Booking', booking._id.toString(), {
      worker_id,
      booking_id: bookingId,
    });

    // Notify the customer
    const populated = await Booking.findById(bookingId).populate('customer_id', 'mobile_number').populate('worker_ids', 'mobile_number');
    const customerMobile = (populated?.customer_id as unknown as { mobile_number?: string })?.mobile_number;
    if (customerMobile) {
      notifyBookingAccepted(customerMobile, bookingId).catch(console.error);
    }

    // Notify the assigned worker per dispatch workflow
    const workerToNotify = (populated?.worker_ids as unknown as { _id: string, mobile_number: string }[])?.find(w => w._id.toString() === worker_id);
    if (workerToNotify && workerToNotify.mobile_number) {
      const location = `Lat: ${booking.farm_location_lat}, Lng: ${booking.farm_location_lng}`; // Fallback since no address string exists
      const timeAndDate = new Date(booking.scheduled_date).toLocaleString();
      notifyWorkerAssigned(workerToNotify.mobile_number, location, timeAndDate).catch(console.error);
    }

    return NextResponse.json({ success: true, data: { booking } });
  } catch (error: unknown) {
    console.error('Admin Assign Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to assign booking' } },
      { status: 500 }
    );
  }
}
