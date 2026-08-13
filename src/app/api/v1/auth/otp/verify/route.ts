import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Otp } from '@/lib/models/Otp';
import { User } from '@/lib/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { mobile_number, otp } = await request.json();

    if (!mobile_number || !otp) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Mobile number and OTP are required' } },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the latest OTP for this number
    const otpRecord = await Otp.findOne({ mobile_number, otp }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } },
        { status: 400 }
      );
    }

    // OTP is valid. Let's delete it so it can't be reused.
    await Otp.deleteOne({ _id: otpRecord._id });

    // Check if user exists
    let user = await User.findOne({ mobile_number });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ mobile_number, role: 'customer' });
      isNewUser = true;
    }

    // Issue JWTs
    const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        isNewUser,
        user: {
          id: user._id,
          role: user.role,
          mobile_number: user.mobile_number,
        }
      },
    });
  } catch (error: unknown) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
