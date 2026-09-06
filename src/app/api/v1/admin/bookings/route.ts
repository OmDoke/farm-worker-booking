import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';

/**
 * GET /api/v1/admin/bookings
 *
 * View/filter all bookings (admin only).
 * Query params:
 *   - status: filter by booking status
 *   - dispute_status: filter by dispute state (open/resolved/none)
 *   - payment_method: filter by payment method
 *   - page: page number (default 1)
 *   - limit: items per page (default 20, max 100)
 *
 * Auth: JWT required (role = admin)
 */
export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const disputeStatus = searchParams.get('dispute_status');
    const paymentMethod = searchParams.get('payment_method');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (disputeStatus) query.dispute_status = disputeStatus;
    if (paymentMethod) query.payment_method = paymentMethod;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customer_id', 'name mobile_number')
        .populate('worker_ids', 'name mobile_number'),
      Booking.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    console.error('Admin Bookings Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' } },
      { status: 500 }
    );
  }
}
