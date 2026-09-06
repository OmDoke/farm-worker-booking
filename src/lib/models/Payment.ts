import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  booking_id: mongoose.Types.ObjectId;
  method: 'cash_after_work' | 'online' | 'cash_advance';
  amount: number;
  commission_amount: number; // platform's cut; deducted before worker payout
  status: 'pending' | 'paid' | 'refunded';
  gateway_reference?: string;
  gateway_event_id?: string; // stored for idempotency — prevent double-processing webhooks
  qr_code_url?: string;
  collected_by?: mongoose.Types.ObjectId;
  confirmed_at?: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    method: {
      type: String,
      enum: ['cash_after_work', 'online', 'cash_advance'],
      required: true,
    },
    amount: { type: Number, required: true },
    commission_amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    gateway_reference: { type: String },
    gateway_event_id: { type: String, unique: true, sparse: true }, // sparse: allow multiple nulls
    qr_code_url: { type: String },
    collected_by: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmed_at: { type: Date },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
