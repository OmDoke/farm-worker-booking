import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { WorkerProfile } from '@/lib/models/WorkerProfile';

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

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (status) query.registration_status = status;

    const workers = await WorkerProfile.find(query)
      .sort({ createdAt: -1 })
      .populate('user_id', 'name mobile_number');

    return NextResponse.json({ success: true, data: workers });
  } catch (error: unknown) {
    console.error('Admin Workers Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch workers' } },
      { status: 500 }
    );
  }
}
