import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { User } from '@/lib/models/User';

export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();
    const profile = await WorkerProfile.findOne({ user_id: authUser.userId }).populate('user_id', 'name mobile_number address');

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Worker profile not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    console.error('Get Worker Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch worker profile' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { skills, service_area, rate, availability, id_proof_url, photo_url, name, address } = body;

    if (name || address) {
      await User.findByIdAndUpdate(authUser.userId, {
        $set: {
          ...(name && { name }),
          ...(address && { address })
        }
      });
    }

    const updatedProfile = await WorkerProfile.findOneAndUpdate(
      { user_id: authUser.userId },
      {
        $set: {
          ...(skills && { skills }),
          ...(service_area && { service_area }),
          ...(rate && { rate }),
          ...(availability && { availability }),
          ...(id_proof_url && { id_proof_url }),
          ...(photo_url && { photo_url }),
        }
      },
      { new: true }
    ).populate('user_id', 'name mobile_number address');

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Worker profile not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedProfile });
  } catch (error: unknown) {
    console.error('Update Worker Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update worker profile' } },
      { status: 500 }
    );
  }
}
