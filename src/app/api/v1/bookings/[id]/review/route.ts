import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/lib/models/Booking';
import { Review } from '@/lib/models/Review';
import { WorkerProfile } from '@/lib/models/WorkerProfile';

/**
 * POST /api/v1/bookings/:id/review
 *
 * Customer submits a 1–5 star rating and optional comment after job completion.
 * - Only callable when booking.status = completed
 * - Only the booking's customer can submit the review
 * - Recomputes WorkerProfile.average_rating from all reviews for that worker
 *
 * Auth: JWT required (role = customer)
 * Body: { rating: number (1-5), comment?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser || authUser.role !== 'customer') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Customer access required' } },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id: bookingId } = await params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    // Only the booking's customer can review
    if (booking.customer_id.toString() !== authUser.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Only reviewable after completion
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Booking must be completed before submitting a review' } },
        { status: 400 }
      );
    }

    if (booking.worker_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_WORKER', message: 'No worker assigned to this booking' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'rating must be a number between 1 and 5' } },
        { status: 400 }
      );
    }

    // Use the primary (first) assigned worker
    const workerId = booking.worker_ids[0];

    // Create review (unique constraint on booking_id prevents duplicates)
    let review;
    try {
      review = await Review.create({
        booking_id: bookingId,
        worker_id: workerId,
        customer_id: authUser.userId,
        rating,
        comment: comment || undefined,
      });
    } catch (err: unknown) {
      // Duplicate key error — review already submitted for this booking
      if ((err as { code?: number }).code === 11000) {
        return NextResponse.json(
          { success: false, error: { code: 'ALREADY_REVIEWED', message: 'You have already reviewed this booking' } },
          { status: 409 }
        );
      }
      throw err;
    }

    // Recompute average_rating for the worker from all their reviews
    const aggregation = await Review.aggregate([
      { $match: { worker_id: workerId } },
      { $group: { _id: '$worker_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (aggregation.length > 0) {
      const newAvg = Math.round(aggregation[0].avg * 10) / 10; // round to 1 decimal
      await WorkerProfile.findOneAndUpdate(
        { user_id: workerId },
        { average_rating: newAvg }
      );
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error: unknown) {
    console.error('Submit Review Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit review' } },
      { status: 500 }
    );
  }
}
