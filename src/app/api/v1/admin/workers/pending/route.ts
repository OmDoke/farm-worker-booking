import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { WorkerProfile } from '@/lib/models/WorkerProfile';

export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    await dbConnect();
    const pendingWorkers = await WorkerProfile.find({ registration_status: 'pending_review' })
      .populate('user_id', 'name mobile_number address');

    return NextResponse.json({ success: true, data: pendingWorkers });
  } catch (error: unknown) {
    console.error('Get Pending Workers Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pending workers' } },
      { status: 500 }
    );
  }
}
