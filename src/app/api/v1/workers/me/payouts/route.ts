import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Payout } from '@/lib/models/Payout';

/**
 * GET /api/v1/workers/me/payouts
 *
 * Worker views their own payout history.
 * Auth: JWT required (role = worker)
 */
export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'worker') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Worker access required' } },
        { status: 403 }
      );
    }

    await dbConnect();

    const payouts = await Payout.find({ worker_id: authUser.userId })
      .sort({ createdAt: -1 });

    const summary = {
      total_paid: payouts
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.net_amount, 0),
      pending: payouts
        .filter((p) => p.status === 'pending' || p.status === 'processing')
        .reduce((sum, p) => sum + p.net_amount, 0),
    };

    return NextResponse.json({ success: true, data: { payouts, summary } });
  } catch (error: unknown) {
    console.error('Worker Payouts Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payouts' } },
      { status: 500 }
    );
  }
}
