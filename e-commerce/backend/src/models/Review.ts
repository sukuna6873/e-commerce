import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  productId: string;
  userId: string;
  rating: number;
  title: string;
  body: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  helpful: { type: Number, default: 0, min: 0 },
  verified: { type: Boolean, default: false },
}, {
  timestamps: true,
});

ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);