import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRateLimit extends Document {
  mobile_number: string;
  attempts: number;
  expiresAt: Date;
}

const RateLimitSchema: Schema<IRateLimit> = new Schema(
  {
    mobile_number: { type: String, required: true },
    attempts: { type: Number, default: 1 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);
