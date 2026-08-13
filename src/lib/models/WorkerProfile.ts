import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkerProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  skills: string[];
  service_area: string;
  rate: number;
  availability: string;
  id_proof_url?: string;
  photo_url?: string;
  registration_status: 'pending_review' | 'approved' | 'rejected';
  is_verified: boolean;
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
    registration_status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
    },
    is_verified: { type: Boolean, default: false },
    average_rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WorkerProfile: Model<IWorkerProfile> =
  mongoose.models.WorkerProfile || mongoose.model<IWorkerProfile>('WorkerProfile', WorkerProfileSchema);
