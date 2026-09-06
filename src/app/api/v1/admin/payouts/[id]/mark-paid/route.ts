import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Payout } from '@/lib/models/Payout';
import { writeAuditLog } from '@/lib/models/AuditLog';

/**
 * POST /api/v1/admin/payouts/:id/mark-paid
 *
 * Admin marks a payout batch as paid with a transfer reference.
 * Auth: JWT required (role = admin)
 * Body: { payout_reference: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id: payoutId } = await params;
    const body = await request.json();
    const { payout_reference } = body;

    if (!payout_reference?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'payout_reference is required' } },
        { status: 400 }
      );
    }

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payout not found' } },
        { status: 404 }
      );
    }

    if (payout.status === 'paid') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_PAID', message: 'Payout already marked as paid' } },
        { status: 409 }
      );
    }

    payout.status = 'paid';
    payout.payout_reference = payout_reference.trim();
    payout.paid_at = new Date();
    await payout.save();

    await writeAuditLog(authUser.userId, 'mark_payout_paid', 'Payout', payoutId, {
      payout_reference,
      net_amount: payout.net_amount,
      worker_id: payout.worker_id.toString(),
    });

    return NextResponse.json({ success: true, data: payout });
  } catch (error: unknown) {
    console.error('Mark Payout Paid Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark payout as paid' } },
      { status: 500 }
    );
  }
}
