import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Otp } from '@/lib/models/Otp';
import { RateLimit } from '@/lib/models/RateLimit';

export async function POST(request: Request) {
  try {
    const { mobile_number } = await request.json();

    if (!mobile_number || !/^\+?[1-9]\d{1,14}$/.test(mobile_number)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Valid mobile number is required' } },
        { status: 400 }
      );
    }

    await dbConnect();

    // Rate limiting: max 5 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const rateLimit = await RateLimit.findOne({ mobile_number, createdAt: { $gte: oneHourAgo } });

    if (rateLimit && rateLimit.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many OTP requests. Try again later.' } },
        { status: 429 }
      );
    }

    if (rateLimit) {
      rateLimit.attempts += 1;
      await rateLimit.save();
    } else {
      await RateLimit.create({
        mobile_number,
        attempts: 1,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real app, integrate SMS provider (Twilio/MSG91) here.
    // We are mocking it by logging to console for MVP.
    console.log(`[MOCK SMS] Sending OTP ${otp} to ${mobile_number}`);

    // Store OTP with 5 min expiry
    await Otp.create({
      mobile_number,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return NextResponse.json({ success: true, data: { message: 'OTP sent successfully' } });
  } catch (error: unknown) {
    console.error('OTP Request Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
