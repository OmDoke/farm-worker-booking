import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkerProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  skills: string[];
  service_area: string;
  rate: number;
  availability?: string;
  id_proof_url?: string;
  photo_url?: string;
  payout_upi_id?: string;
  payout_bank_details?: {
    account_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
  };
  commission_balance_due: number; // running commission owed from cash bookings
  registration_status: 'pending_review' | 'approved' | 'rejected' | 'suspended';
  is_verified: boolean;
  onboarded_by?: mongoose.Types.ObjectId; // admin who created via phone intake
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  rejection_reason?: string;
  average_rating: number;
}

const WorkerProfileSchema: Schema<IWorkerProfile> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills: { type: [String], default: [] },
    service_area: { type: String, required: true },
    rate: { type: Number, required: true },
    availability: { type: String },
    id_proof_url: { type: String },
    photo_url: { type: String },
    payout_upi_id: { type: String },
    payout_bank_details: {
      account_name: { type: String },
      account_number: { type: String },
      ifsc_code: { type: String },
      bank_name: { type: String },
    },
    commission_balance_due: { type: Number, default: 0 },
    registration_status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected', 'suspended'],
      default: 'pending_review',
    },
    is_verified: { type: Boolean, default: false },
    onboarded_by: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewed_at: { type: Date },
    rejection_reason: { type: String },
    average_rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WorkerProfile: Model<IWorkerProfile> =
  mongoose.models.WorkerProfile ||
  mongoose.model<IWorkerProfile>('WorkerProfile', WorkerProfileSchema);
