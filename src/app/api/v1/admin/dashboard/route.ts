import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { Booking } from '@/lib/models/Booking';
import { Payment } from '@/lib/models/Payment';
import { Payout } from '@/lib/models/Payout';

/**
 * GET /api/v1/admin/dashboard
 *
 * Returns all dashboard metric cards in one call (SRS v1.3 §3.4).
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

    const [
      totalWorkers,
      pendingReview,
      approvedWorkers,
      rejectedWorkers,
      bookingsNeedingStaffing,
      activeBookingsToday,
      completedBookings,
      openDisputes,
      pendingPayouts,
      pendingPayoutValue,
      onlineRevenue,
      cashRevenue,
    ] = await Promise.all([
      WorkerProfile.countDocuments(),
      WorkerProfile.countDocuments({ registration_status: 'pending_review' }),
      WorkerProfile.countDocuments({ registration_status: 'approved' }),
      WorkerProfile.countDocuments({ registration_status: 'rejected' }),
      Booking.countDocuments({ status: 'pending_assignment' }),
      Booking.countDocuments({
        status: { $in: ['pending_assignment', 'confirmed', 'in_progress', 'awaiting_cash_confirmation'] },
      }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ dispute_status: 'open' }),
      Payout.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      Payout.aggregate([
        { $match: { status: { $in: ['pending', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$net_amount' } } },
      ]).then((r) => r[0]?.total ?? 0),
      Payment.aggregate([
        { $match: { method: 'online', status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission_amount' } } },
      ]).then((r) => ({ revenue: r[0]?.total ?? 0, commission: r[0]?.commission ?? 0 })),
      Payment.aggregate([
        { $match: { method: { $in: ['cash_after_work', 'cash_advance'] }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission_amount' } } },
      ]).then((r) => ({ revenue: r[0]?.total ?? 0, commission: r[0]?.commission ?? 0 })),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        workers: {
          total: totalWorkers,
          pending_review: pendingReview,
          approved: approvedWorkers,
          rejected: rejectedWorkers,
        },
        bookings: {
          needing_staffing: bookingsNeedingStaffing,
          active_today: activeBookingsToday,
          completed: completedBookings,
          open_disputes: openDisputes,
        },
        payouts: {
          pending_count: pendingPayouts,
          pending_value: pendingPayoutValue,
        },
        revenue: {
          online: onlineRevenue,
          cash: cashRevenue,
          total_commission:
            (onlineRevenue.commission ?? 0) + (cashRevenue.commission ?? 0),
        },
      },
    });
  } catch (error: unknown) {
    console.error('Admin Dashboard Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } },
      { status: 500 }
    );
  }
}
