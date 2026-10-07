import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: string;
  variantValue: string;
  quantity: number;
}

export interface ICart extends Document {
  userId?: string;
  sessionId?: string;
  items: ICartItem[];
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  variantValue: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const CartSchema = new Schema<ICart>({
  userId: { type: String, index: true, sparse: true },
  sessionId: { type: String, index: true, sparse: true },
  items: [CartItemSchema],
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: false,
});

CartSchema.index({ userId: 1 }, { unique: true, sparse: true });
CartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

export const Cart = mongoose.model<ICart>('Cart', CartSchema);