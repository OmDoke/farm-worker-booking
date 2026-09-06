import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  role: 'customer' | 'worker' | 'admin';
  admin_tier?: 'support_admin' | 'super_admin';
  name?: string;
  mobile_number: string;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  preferred_language?: string;
  notification_channel: 'sms' | 'whatsapp' | 'both';
  account_status: 'active' | 'blocked' | 'deleted';
  terms_accepted_at?: Date;
  terms_version?: string;
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
    admin_tier: {
      type: String,
      enum: ['support_admin', 'super_admin'],
    },
    name: { type: String },
    mobile_number: { type: String, required: true, unique: true },
    address: { type: String },
    location_lat: { type: Number },
    location_lng: { type: Number },
    preferred_language: { type: String, default: 'mr' },
    notification_channel: {
      type: String,
      enum: ['sms', 'whatsapp', 'both'],
      default: 'sms',
    },
    account_status: {
      type: String,
      enum: ['active', 'blocked', 'deleted'],
      default: 'active',
    },
    terms_accepted_at: { type: Date },
    terms_version: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
