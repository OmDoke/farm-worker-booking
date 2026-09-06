import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { writeAuditLog } from '@/lib/models/AuditLog';

/**
 * POST /api/v1/admin/bookings/:id/resolve-dispute
 *
 * Admin records a dispute outcome without altering the booking's own status.
 * A completed booking that was disputed stays completed — dispute_status is
 * tracked independently per SRS v1.3 §3.8 and FR-26.
 *
 * Auth: JWT required (role = admin)
 * Body: { resolution_notes: string }
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
    const { resolution_notes } = body;

    if (!resolution_notes?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'resolution_notes is required' } },
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

    if (booking.dispute_status !== 'open') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Booking does not have an open dispute' } },
        { status: 400 }
      );
    }

    booking.dispute_status = 'resolved';
    booking.resolution_notes = resolution_notes.trim();
    booking.resolved_by = authUser.userId as unknown as import('mongoose').Types.ObjectId;
    booking.resolved_at = new Date();
    await booking.save();

    await writeAuditLog(authUser.userId, 'resolve_dispute', 'Booking', bookingId, {
      resolution_notes,
      booking_status: booking.status,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    console.error('Resolve Dispute Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve dispute' } },
      { status: 500 }
    );
  }
}
