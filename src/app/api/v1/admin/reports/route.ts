import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { Payment } from '@/lib/models/Payment';

/**
 * GET /api/v1/admin/reports
 *
 * Returns platform analytics:
 *   - Bookings per day (last 30 days)
 *   - Active worker count
 *   - Revenue and commission by payment method
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

    await dbConnect();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [bookingsPerDay, revenueByMethod] = await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: '$method',
            total_revenue: { $sum: '$amount' },
            total_commission: { $sum: '$commission_amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        bookings_per_day: bookingsPerDay,
        revenue_by_method: revenueByMethod,
      },
    });
  } catch (error: unknown) {
    console.error('Admin Reports Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate reports' } },
      { status: 500 }
    );
  }
}
