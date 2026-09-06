import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  booking_id: mongoose.Types.ObjectId;
  worker_id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  rating: number; // 1–5
  comment?: string;
  created_at: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    worker_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
