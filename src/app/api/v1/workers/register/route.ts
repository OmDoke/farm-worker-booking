import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { User } from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if worker profile already exists
    const existingProfile = await WorkerProfile.findOne({ user_id: authUser.userId });
    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_REGISTERED', message: 'Worker profile already exists' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { skills, service_area, rate, availability, id_proof_url, photo_url, name, address } = body;

    if (!service_area || !rate) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'service_area and rate are required' } },
        { status: 400 }
      );
    }

    // Update User with name and address if provided
    if (name || address) {
      await User.findByIdAndUpdate(authUser.userId, { 
        $set: { 
          ...(name && { name }), 
          ...(address && { address }),
          role: 'worker' // upgrade role to worker
        } 
      });
    } else {
      await User.findByIdAndUpdate(authUser.userId, { $set: { role: 'worker' } });
    }

    const workerProfile = await WorkerProfile.create({
      user_id: authUser.userId,
      skills: skills || [],
      service_area,
      rate,
      availability,
      id_proof_url,
      photo_url,
      registration_status: 'pending_review',
      is_verified: false,
    });

    return NextResponse.json({
      success: true,
      data: workerProfile,
    });
  } catch (error: unknown) {
    console.error('Worker Register Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to register worker' } },
      { status: 500 }
    );
  }
}
