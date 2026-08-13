import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtp extends Document {
  mobile_number: string;
  otp: string;
  expiresAt: Date;
}

const OtpSchema: Schema<IOtp> = new Schema(
  {
    mobile_number: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
