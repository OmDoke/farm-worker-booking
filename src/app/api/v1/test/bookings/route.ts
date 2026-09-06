import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/lib/models/Booking';

export async function GET() {
  await dbConnect();
  const bookings = await Booking.find({});
  return NextResponse.json({ bookings });
}
