import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction =
  | 'approve_worker'
  | 'reject_worker'
  | 'suspend_worker'
  | 'assign_booking'
  | 'reassign_booking'
  | 'confirm_cash'
  | 'cancel_booking'
  | 'update_category'
  | 'resolve_dispute'
  | 'mark_payout_paid'
  | 'update_settings'
  | 'manual_onboard_worker';

export type AuditEntityType =
  | 'Booking'
  | 'WorkerProfile'
  | 'Payment'
  | 'Payout'
  | 'ServiceCategory'
  | 'PlatformSettings'
  | 'BookingAssignment';

export interface IAuditLog extends Document {
  actor_user_id: mongoose.Types.ObjectId;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>; // old values, new values, reason
  created_at: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    actor_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'approve_worker',
        'reject_worker',
        'suspend_worker',
        'assign_booking',
        'reassign_booking',
        'confirm_cash',
        'cancel_booking',
        'update_category',
        'resolve_dispute',
        'mark_payout_paid',
        'update_settings',
        'manual_onboard_worker',
      ],
      required: true,
    },
    entity_type: {
      type: String,
      enum: [
        'Booking',
        'WorkerProfile',
        'Payment',
        'Payout',
        'ServiceCategory',
        'PlatformSettings',
        'BookingAssignment',
      ],
      required: true,
    },
    entity_id: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index for audit history on a specific entity
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
// Index for actor history
AuditLogSchema.index({ actor_user_id: 1, created_at: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// ── Helper ──────────────────────────────────────────────────────────────────
export async function writeAuditLog(
  actorUserId: string,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await AuditLog.create({
      actor_user_id: actorUserId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (err) {
    // Audit log failure must never crash the main request
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}
