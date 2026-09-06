import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayout extends Document {
  worker_id: mongoose.Types.ObjectId;
  period_start: Date;
  period_end: Date;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  payout_reference?: string; // bank/UPI transfer reference once paid
  paid_at?: Date;
}

const PayoutSchema: Schema<IPayout> = new Schema(
  {
    worker_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period_start: { type: Date, required: true },
    period_end: { type: Date, required: true },
    gross_amount: { type: Number, required: true },
    commission_amount: { type: Number, required: true },
    net_amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending',
    },
    payout_reference: { type: String },
    paid_at: { type: Date },
  },
  { timestamps: true }
);

PayoutSchema.index({ worker_id: 1, status: 1 });
PayoutSchema.index({ period_start: 1, period_end: 1 });

export const Payout: Model<IPayout> =
  mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);
