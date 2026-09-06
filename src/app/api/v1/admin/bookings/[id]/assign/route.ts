import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { BookingAssignment } from '@/lib/models/BookingAssignment';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { writeAuditLog } from '@/lib/models/AuditLog';
import { getSetting } from '@/lib/models/PlatformSettings';
import { notifyBookingAccepted } from '@/lib/notifications';

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

    // Get SLA from settings (default 120 min)
    const slaMins = parseInt((await getSetting('acceptance_sla_minutes')) || '120', 10);
    const responseDeadline = new Date(Date.now() + slaMins * 60 * 1000);

    // Find or create the assignment slot
    let assignment;
    if (assignment_id) {
      assignment = await BookingAssignment.findOneAndUpdate(
        { _id: assignment_id, booking_id: bookingId },
        {
          worker_id,
          status: 'assigned',
          assigned_at: new Date(),
          response_deadline: responseDeadline,
        },
        { returnDocument: 'after' }
      );
      if (!assignment) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
          { status: 404 }
        );
      }
    } else {
      // Take the first open slot
      assignment = await BookingAssignment.findOneAndUpdate(
        { booking_id: bookingId, status: 'open' },
        {
          worker_id,
          status: 'assigned',
          assigned_at: new Date(),
          response_deadline: responseDeadline,
        },
        { returnDocument: 'after' }
      );
      if (!assignment) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_OPEN_SLOTS', message: 'No open assignment slots on this booking' } },
          { status: 400 }
        );
      }
    }

    // Add worker to booking.worker_ids if not already there
    if (!booking.worker_ids.some((id) => id.toString() === worker_id)) {
      booking.worker_ids.push(worker_id as unknown as import('mongoose').Types.ObjectId);
      await booking.save();
    }

    const action = assignment_id ? 'reassign_booking' : 'assign_booking';
    await writeAuditLog(authUser.userId, action, 'BookingAssignment', assignment._id.toString(), {
      worker_id,
      booking_id: bookingId,
    });

    // Notify the customer
    const populated = await Booking.findById(bookingId).populate('customer_id', 'mobile_number');
    const customerMobile = (populated?.customer_id as unknown as { mobile_number?: string })?.mobile_number;
    if (customerMobile) {
      notifyBookingAccepted(customerMobile, bookingId).catch(console.error);
    }

    return NextResponse.json({ success: true, data: { booking, assignment } });
  } catch (error: unknown) {
    console.error('Admin Assign Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to assign booking' } },
      { status: 500 }
    );
  }
}
