import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBookingAssignment extends Document {
  booking_id: mongoose.Types.ObjectId;
  worker_id?: mongoose.Types.ObjectId; // null while slot is open
  status: 'open' | 'assigned' | 'accepted' | 'declined' | 'no_show' | 'completed';
  assigned_at?: Date;
  response_deadline?: Date;
  responded_at?: Date;
  completed_at?: Date;
}

const BookingAssignmentSchema: Schema<IBookingAssignment> = new Schema(
  {
    booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    worker_id: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['open', 'assigned', 'accepted', 'declined', 'no_show', 'completed'],
      default: 'open',
    },
    assigned_at: { type: Date },
    response_deadline: { type: Date },
    responded_at: { type: Date },
    completed_at: { type: Date },
  },
  { timestamps: true }
);

// Index for quickly fetching all slots of a booking
BookingAssignmentSchema.index({ booking_id: 1, status: 1 });
// Index for worker's assignments
BookingAssignmentSchema.index({ worker_id: 1, status: 1 });

export const BookingAssignment: Model<IBookingAssignment> =
  mongoose.models.BookingAssignment ||
  mongoose.model<IBookingAssignment>('BookingAssignment', BookingAssignmentSchema);
