import { NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Refresh token is required' } },
        { status: 400 }
      );
    }

    // Verify token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (_err) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Check if user still exists
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' } },
        { status: 401 }
      );
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: unknown) {
    console.error('Auth Refresh Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
