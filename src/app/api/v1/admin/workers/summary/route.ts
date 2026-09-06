import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { WorkerProfile } from '@/lib/models/WorkerProfile';

/**
 * GET /api/v1/admin/workers/summary
 *
 * Returns total/pending/approved/rejected/suspended worker counts.
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

    const summary = await WorkerProfile.aggregate([
      {
        $group: {
          _id: '$registration_status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts: Record<string, number> = {
      total: 0,
      pending_review: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    };

    for (const item of summary) {
      counts[item._id as string] = item.count;
      counts.total += item.count;
    }

    return NextResponse.json({ success: true, data: counts });
  } catch (error: unknown) {
    console.error('Worker Summary Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch worker summary' } },
      { status: 500 }
    );
  }
}
