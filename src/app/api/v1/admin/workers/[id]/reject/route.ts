import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { WorkerProfile } from '@/lib/models/WorkerProfile';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id: workerId } = await params;
    const profile = await WorkerProfile.findByIdAndUpdate(
      workerId,
      {
        $set: {
          registration_status: 'rejected',
          is_verified: false,
        }
      },
      { new: true }
    ).populate('user_id', 'name mobile_number address');

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Worker profile not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    console.error('Reject Worker Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject worker' } },
      { status: 500 }
    );
  }
}
