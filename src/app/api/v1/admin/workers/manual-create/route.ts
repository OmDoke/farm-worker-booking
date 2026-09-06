import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { User } from '@/lib/models/User';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { writeAuditLog } from '@/lib/models/AuditLog';

/**
 * POST /api/v1/admin/workers/manual-create
 *
 * Admin-assisted worker onboarding (FR-24 / SRS v1.3 §3.3a).
 * Admin creates a worker profile on behalf of a worker who can't self-register
 * (e.g. over a phone call). The worker must still verify their OTP at least once
 * before the account is usable. The profile enters the same pending_review queue.
 *
 * Auth: JWT required (role = admin)
 * Body: { mobile_number, name, address, service_area, skills[], rate, availability?,
 *         payout_upi_id?, photo_url?, id_proof_url? }
 */
export async function POST(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      mobile_number,
      name,
      address,
      service_area,
      skills,
      rate,
      availability,
      payout_upi_id,
      photo_url,
      id_proof_url,
    } = body;

    if (!mobile_number || !name || !service_area || !skills || !rate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'mobile_number, name, service_area, skills, and rate are required',
          },
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create or find the user account
    let user = await User.findOne({ mobile_number });
    if (!user) {
      user = await User.create({
        mobile_number,
        name,
        address,
        role: 'worker',
        account_status: 'active',
      });
    } else if (user.role !== 'worker') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A non-worker account already exists with this mobile number',
          },
        },
        { status: 409 }
      );
    }

    // Check if a worker profile already exists
    const existing = await WorkerProfile.findOne({ user_id: user._id });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CONFLICT', message: 'Worker profile already exists for this user' },
        },
        { status: 409 }
      );
    }

    const profile = await WorkerProfile.create({
      user_id: user._id,
      skills: Array.isArray(skills) ? skills : [skills],
      service_area,
      rate,
      availability,
      payout_upi_id,
      photo_url,
      id_proof_url,
      registration_status: 'pending_review',
      is_verified: false,
      onboarded_by: authUser.userId,
    });

    await writeAuditLog(
      authUser.userId,
      'manual_onboard_worker',
      'WorkerProfile',
      profile._id.toString(),
      { mobile_number, name }
    );

    return NextResponse.json({ success: true, data: { user, profile } }, { status: 201 });
  } catch (error: unknown) {
    console.error('Manual Worker Create Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create worker' } },
      { status: 500 }
    );
  }
}
