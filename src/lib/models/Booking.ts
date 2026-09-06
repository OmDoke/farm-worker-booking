import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
  customer_id: mongoose.Types.ObjectId;
  worker_ids: mongoose.Types.ObjectId[];
  farm_size_acres: number;
  processes: string[];
  scheduled_date: Date;
  payment_method: 'cash_after_work' | 'online' | 'cash_advance';
  status:
    | 'pending_assignment'
    | 'awaiting_cash_confirmation'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled';
  total_estimated_amount: number;
  farm_location_lat?: number;
  farm_location_lng?: number;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker_ids: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    farm_size_acres: { type: Number, required: true },
    processes: { type: [String], required: true },
    scheduled_date: { type: Date, required: true },
    payment_method: {
      type: String,
      enum: ['cash_after_work', 'online', 'cash_advance'],
      default: 'cash_after_work',
    },
    status: {
      type: String,
      enum: [
        'pending_assignment',
        'awaiting_cash_confirmation',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
      ],
      default: 'pending_assignment',
    },
    total_estimated_amount: { type: Number, default: 0 },
    farm_location_lat: { type: Number },
    farm_location_lng: { type: Number },
  },
  { timestamps: true }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
