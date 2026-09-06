import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { PlatformSettings, seedPlatformSettings } from '@/lib/models/PlatformSettings';
import { writeAuditLog } from '@/lib/models/AuditLog';
import { User } from '@/lib/models/User';

const EDITABLE_KEYS = ['commission_percent', 'acceptance_sla_minutes', 'escalation_radius_km', 'terms_version'];

/**
 * GET /api/v1/admin/settings
 * Returns all platform settings.
 * Auth: JWT required (role = admin)
 *
 * PATCH /api/v1/admin/settings
 * Update one or more settings. Only super_admin can change commission or SLA.
 * Auth: JWT required (role = admin, admin_tier = super_admin for sensitive keys)
 * Body: { key: string, value: string }
 */
export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    await dbConnect();
    await seedPlatformSettings(); // ensures defaults exist

    const settings = await PlatformSettings.find({}).sort({ key: 1 });
    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    console.error('Get Settings Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'key and value are required' } },
        { status: 400 }
      );
    }

    if (!EDITABLE_KEYS.includes(key)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_KEY', message: `${key} is not an editable setting` } },
        { status: 400 }
      );
    }

    // Sensitive settings (commission, SLA) require super_admin tier
    const sensitiveKeys = ['commission_percent', 'acceptance_sla_minutes'];
    if (sensitiveKeys.includes(key)) {
      await dbConnect();
      const adminUser = await User.findById(authUser.userId);
      if (adminUser?.admin_tier !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'super_admin tier required to change this setting' } },
          { status: 403 }
        );
      }
    }

    await dbConnect();

    const setting = await PlatformSettings.findOneAndUpdate(
      { key },
      { value: String(value), updated_at: new Date(), updated_by: authUser.userId },
      { returnDocument: 'after', upsert: true }
    );

    await writeAuditLog(authUser.userId, 'update_settings', 'PlatformSettings', setting!._id.toString(), {
      key,
      new_value: value,
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error: unknown) {
    console.error('Update Settings Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update setting' } },
      { status: 500 }
    );
  }
}
