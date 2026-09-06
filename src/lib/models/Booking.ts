import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
  customer_id: mongoose.Types.ObjectId;
  worker_ids: mongoose.Types.ObjectId[]; // kept for backward-compat; primary source is BookingAssignment
  workers_needed: number;
  farm_size_acres: number;
  processes: string[];
  scheduled_date: Date;
  payment_method: 'cash_after_work' | 'online' | 'cash_advance';
  estimated_cost: number;
  status:
    | 'pending_assignment'
    | 'awaiting_cash_confirmation'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'no_show'
    | 'cancelled';
  dispute_status: 'none' | 'open' | 'resolved';
  dispute_reason?: string;
  resolution_notes?: string;
  resolved_by?: mongoose.Types.ObjectId;
  resolved_at?: Date;
  cancellation_reason?: string;
  farm_location_lat?: number;
  farm_location_lng?: number;
  total_estimated_amount: number;
  started_at?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker_ids: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    workers_needed: { type: Number, default: 1, min: 1 },
    farm_size_acres: { type: Number, required: true },
    processes: { type: [String], required: true },
    scheduled_date: { type: Date, required: true },
    payment_method: {
      type: String,
      enum: ['cash_after_work', 'online', 'cash_advance'],
      default: 'cash_after_work',
    },
    estimated_cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'pending_assignment',
        'awaiting_cash_confirmation',
        'confirmed',
        'in_progress',
        'completed',
        'no_show',
        'cancelled',
      ],
      default: 'pending_assignment',
    },
    dispute_status: {
      type: String,
      enum: ['none', 'open', 'resolved'],
      default: 'none',
    },
    dispute_reason: { type: String },
    resolution_notes: { type: String },
    resolved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    resolved_at: { type: Date },
    cancellation_reason: { type: String },
    total_estimated_amount: { type: Number, default: 0 },
    farm_location_lat: { type: Number },
    farm_location_lng: { type: Number },
    started_at: { type: Date },
    completed_at: { type: Date },
    cancelled_at: { type: Date },
  },
  { timestamps: true }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
