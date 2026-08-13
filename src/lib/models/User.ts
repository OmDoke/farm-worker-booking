import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  role: 'customer' | 'worker' | 'admin';
  name?: string;
  mobile_number: string;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  preferred_language?: string;
  created_at: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    role: {
      type: String,
      enum: ['customer', 'worker', 'admin'],
      default: 'customer',
      required: true,
    },
    name: { type: String },
    mobile_number: { type: String, required: true, unique: true },
    address: { type: String },
    location_lat: { type: Number },
    location_lng: { type: Number },
    preferred_language: { type: String, default: 'mr' },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Prevent re-compilation of model
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
